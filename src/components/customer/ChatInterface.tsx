'use client'

import { useState, useRef, useEffect } from 'react'
import { addPurchase } from '@/actions/ledger'
import { Send, Check, CheckCheck, Clock, WifiOff } from 'lucide-react'
import { io } from 'socket.io-client'

type Message = {
  id: string
  type: 'PURCHASE' | 'PAYMENT' | 'TEXT'
  amount?: number
  text?: string
  status?: string
  timestamp: number
  isSelf: boolean
}

export default function ChatInterface({ 
  customerId, 
  initialBalance,
  initialMessages 
}: { 
  customerId: string
  initialBalance: number
  initialMessages: Message[]
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [inputValue, setInputValue] = useState('')
  const [balance, setBalance] = useState(initialBalance)
  const [isSending, setIsSending] = useState(false)
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    const socket = io()

    socket.on('connect', () => {
      socket.emit('join_customer', customerId)
    })

    socket.on('new_payment', (data: { id: string, amount: number, newBalance: number, timestamp: number }) => {
      const newMsg: Message = {
        id: data.id,
        type: 'PAYMENT',
        amount: data.amount,
        status: 'PAID',
        timestamp: data.timestamp,
        isSelf: false
      }
      setMessages(prev => [...prev, newMsg])
      setBalance(data.newBalance)
    })

    socket.on('new_chat_message', (data: { id: string, text: string, timestamp: number }) => {
      const newMsg: Message = {
        id: data.id,
        type: 'TEXT',
        text: data.text,
        timestamp: data.timestamp,
        isSelf: false
      }
      setMessages(prev => [...prev, newMsg])
    })

    socket.on('purchase_deleted', (data: { id: string }) => {
      setMessages(prev => prev.map(m => m.id === data.id ? { ...m, status: 'CANCELLED' } : m))
      // Balance update ideally synced via separate event or API refetch, but UI handles status
    })

    socket.on('purchase_edited', (data: { id: string, newAmount: number }) => {
      setMessages(prev => prev.map(m => m.id === data.id ? { ...m, amount: data.newAmount } : m))
    })

    return () => {
      socket.disconnect()
    }
  }, [customerId])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isOnline) return
    
    const amount = parseInt(inputValue, 10)
    if (isNaN(amount) || amount <= 0) return

    setInputValue('')
    setIsSending(true)

    // Optimistic UI update
    const tempId = crypto.randomUUID()
    const newMsg: Message = {
      id: tempId,
      type: 'PURCHASE',
      amount,
      status: 'PENDING',
      timestamp: Date.now(),
      isSelf: true
    }
    setMessages(prev => [...prev, newMsg])

    // Server Action
    const res = await addPurchase(customerId, amount)

    if (res.success) {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'UNPAID' } : m))
      setBalance(prev => prev + amount)
    } else {
      // Revert optimistic update on failure (basic)
      setMessages(prev => prev.filter(m => m.id !== tempId))
      alert('Failed to send purchase amount.')
    }
    
    setIsSending(false)
  }

  return (
    <>
      {!isOnline && (
        <div className="bg-red-500 text-zinc-900 text-xs text-center py-1 font-medium flex items-center justify-center gap-2">
          <WifiOff className="h-3 w-3" /> You are offline
        </div>
      )}
      <div className="bg-emerald-50 px-4 py-3 border-b border-emerald-100 shrink-0 text-center relative z-20 shadow-sm">
        <p className="text-xs text-emerald-700/70 font-medium uppercase tracking-wider mb-0.5">Pending Balance</p>
        <p className="text-xl font-bold text-emerald-600 tracking-tight">₹{balance}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-100">
        {messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <div className="bg-zinc-50/80 px-4 py-2 rounded-xl text-xs text-zinc-400 border border-zinc-200/50 shadow-sm text-center">
              Send your purchase amount (e.g. 120)<br/>to add it to your ledger.
            </div>
          </div>
        ) : (
          messages.map(msg => {
            if (msg.type === 'TEXT') {
              return (
                <div key={msg.id} className="flex flex-col items-start w-full mb-4">
                  <div className="max-w-[85%] bg-zinc-200 text-zinc-800 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm border border-zinc-300">
                    <p className="text-[15px] leading-relaxed">{msg.text}</p>
                    <div className="text-[10px] text-zinc-400 mt-2 text-right">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              )
            }

            if (msg.type === 'PAYMENT') {
              return (
                <div key={msg.id} className="flex flex-col items-start w-full mb-4">
                  <div className="max-w-[85%] bg-zinc-200 text-zinc-800 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm border border-zinc-300">
                    <p className="text-sm font-medium mb-1">
                      Payment of <span className="text-emerald-600 font-bold">₹{msg.amount}</span> is successful.
                    </p>
                    <p className="text-xs text-zinc-400">
                      Your pending balance has been updated.
                    </p>
                    <div className="text-[10px] text-zinc-400 mt-2 text-right">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              )
            }

            // PURCHASE
            const isCancelled = msg.status === 'CANCELLED'
            return (
              <div key={msg.id} className="flex flex-col items-end w-full mb-2">
                <div className={`max-w-[75%] px-4 py-2 rounded-2xl rounded-tr-sm shadow-sm relative group ${
                  isCancelled ? 'bg-emerald-50 text-emerald-900/50 border border-emerald-200' : 'bg-emerald-700 text-white'
                }`}>
                  <span className="text-lg font-medium">
                    {isCancelled ? <s>{msg.amount}</s> : msg.amount}
                  </span>
                  
                  <div className={`flex items-center justify-end gap-1 mt-1 ${isCancelled ? 'opacity-40' : 'opacity-70'}`}>
                    <span className="text-[10px] leading-none">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {!isCancelled && (
                      <>
                        {msg.status === 'PENDING' && <Clock className="h-[10px] w-[10px]" />}
                        {msg.status === 'UNPAID' && <Check className="h-3 w-3" />}
                        {(msg.status === 'PARTIALLY_PAID' || msg.status === 'PAID') && <CheckCheck className={`h-3 w-3 ${msg.status === 'PAID' ? 'text-blue-300' : ''}`} />}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 bg-zinc-50 border-t border-zinc-200 shrink-0">
        <div className="flex items-center gap-2">
          <input
            type="number"
            pattern="[0-9]*"
            inputMode="numeric"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={!isOnline}
            placeholder={isOnline ? "Enter amount..." : "Offline"}
            className="flex-1 h-12 bg-white border border-zinc-200 rounded-full px-5 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-lg disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputValue || isSending || !isOnline}
            className="h-12 w-12 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 flex items-center justify-center rounded-full text-white shrink-0 transition-colors shadow-sm"
          >
            <Send className="h-5 w-5 ml-1" />
          </button>
        </div>
      </form>
    </>
  )
}
