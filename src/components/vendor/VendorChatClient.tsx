'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, CheckCheck, Search, MoreVertical, Edit2, Trash2, X } from 'lucide-react'
import { io } from 'socket.io-client'
import { sendChatMessage, deletePurchase, editPurchaseAmount } from '@/actions/chat'

type Message = {
  id: string
  type: 'PURCHASE' | 'PAYMENT' | 'TEXT'
  amount?: number
  text?: string
  status?: string
  timestamp: number
  isSelf: boolean
  read?: boolean
}

type CustomerData = {
  id: string
  name: string
  phone: string
  balance: number
  messages: Message[]
  unreadCount: number
}

export default function VendorChatClient({ initialCustomers }: { initialCustomers: CustomerData[] }) {
  const [customers, setCustomers] = useState<CustomerData[]>(initialCustomers)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [editingMsg, setEditingMsg] = useState<{ id: string, amount: number } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId)

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone.includes(searchQuery)
  )

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [selectedCustomer?.messages])

  useEffect(() => {
    const socket = io()

    socket.on('connect', () => {
      socket.emit('join_vendor_dashboard')
    })

    socket.on('new_purchase', (data: { customerId: string, id: string, amount: number, timestamp: number }) => {
      setCustomers(prev => {
        const cIdx = prev.findIndex(c => c.id === data.customerId)
        if (cIdx === -1) return prev
        const newC = { ...prev[cIdx] }
        newC.messages = [...newC.messages, {
          id: data.id,
          type: 'PURCHASE',
          amount: data.amount,
          status: 'PENDING',
          timestamp: data.timestamp || Date.now(),
          isSelf: false
        }]
        newC.balance += data.amount
        if (selectedCustomerId !== data.customerId) {
          newC.unreadCount += 1
        }
        
        // Move to top
        const updated = [...prev]
        updated.splice(cIdx, 1)
        return [newC, ...updated]
      })
    })

    // Additional listeners can be added for payments, text messages, edits, etc.

    return () => {
      socket.disconnect()
    }
  }, [selectedCustomerId])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomerId || !inputValue.trim() || isSending) return
    
    const text = inputValue.trim()
    setInputValue('')
    setIsSending(true)

    const res = await sendChatMessage(selectedCustomerId, text)
    if (res.success && res.message) {
      const msg = res.message
      setCustomers(prev => prev.map(c => {
        if (c.id === selectedCustomerId) {
          return {
            ...c,
            messages: [...c.messages, {
              id: msg.id,
              type: 'TEXT',
              text: msg.text,
              timestamp: Number(msg.createdAt),
              isSelf: true
            }]
          }
        }
        return c
      }))
    }
    setIsSending(false)
  }

  const handleDeletePurchase = async (purchaseId: string) => {
    if (!confirm('Are you sure you want to delete this purchase?')) return
    const res = await deletePurchase(purchaseId)
    if (res.success) {
      setCustomers(prev => prev.map(c => {
        if (c.id === selectedCustomerId) {
          return {
            ...c,
            messages: c.messages.map(m => m.id === purchaseId ? { ...m, status: 'CANCELLED' } : m)
          }
        }
        return c
      }))
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMsg || !selectedCustomerId) return
    
    const res = await editPurchaseAmount(editingMsg.id, editingMsg.amount)
    if (res.success) {
      setCustomers(prev => prev.map(c => {
        if (c.id === selectedCustomerId) {
          return {
            ...c,
            messages: c.messages.map(m => m.id === editingMsg.id ? { ...m, amount: editingMsg.amount } : m)
          }
        }
        return c
      }))
      setEditingMsg(null)
    }
  }

  return (
    <div className="flex w-full h-full bg-white overflow-hidden relative">
      
      {/* LEFT SIDEBAR (List) */}
      <div className={`
        w-full md:w-80 bg-zinc-50 border-r border-zinc-200 flex flex-col shrink-0 absolute md:relative inset-0 z-20 transition-transform duration-300
        ${selectedCustomerId ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}
      `}>
        <div className="p-4 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between shrink-0">
          <h2 className="font-semibold text-zinc-900">Chats</h2>
        </div>
        <div className="p-2 border-b border-zinc-200 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search customers..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-zinc-200 rounded-lg pl-9 pr-4 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredCustomers.map(c => {
            const lastMsg = c.messages[c.messages.length - 1]
            let preview = 'No messages'
            if (lastMsg) {
              if (lastMsg.type === 'TEXT') preview = lastMsg.text || ''
              else if (lastMsg.type === 'PURCHASE') preview = `Purchase: ₹${lastMsg.amount}`
              else if (lastMsg.type === 'PAYMENT') preview = `Payment: ₹${lastMsg.amount}`
            }

            return (
              <div 
                key={c.id} 
                onClick={() => {
                  setSelectedCustomerId(c.id)
                  // clear unread count
                  setCustomers(prev => prev.map(p => p.id === c.id ? { ...p, unreadCount: 0 } : p))
                }}
                className={`flex items-center gap-3 p-3 cursor-pointer border-b border-zinc-200/50 hover:bg-zinc-200/50 transition-colors ${selectedCustomerId === c.id ? 'bg-zinc-200' : ''}`}
              >
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center border border-emerald-200 shrink-0">
                  <span className="font-bold text-emerald-700">{(c.name || 'U').charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-900 truncate">{c.name || c.phone}</span>
                    <span className="text-xs text-zinc-400">
                      {lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-zinc-400 truncate">{preview}</span>
                    {c.unreadCount > 0 && (
                      <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                        {c.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div className={`
        flex-1 flex flex-col absolute md:relative inset-0 z-10 bg-zinc-100 transition-transform duration-300 w-full
        ${selectedCustomerId ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        {selectedCustomer ? (
          <>
            {/* Chat Header */}
            <div className="h-16 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between px-4 md:px-6 shrink-0 relative z-20">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedCustomerId(null)}
                  className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-zinc-900"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center border border-emerald-200 shrink-0">
                  <span className="font-bold text-emerald-700">{(selectedCustomer.name || 'U').charAt(0).toUpperCase()}</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-zinc-900 leading-tight truncate">{selectedCustomer.name || 'Unknown'}</h3>
                  <p className="text-xs text-zinc-400 truncate">{selectedCustomer.phone}</p>
                </div>
              </div>
            <div className="flex items-center gap-4 text-zinc-400 font-medium">
              <span>Balance: <span className="text-emerald-600 font-bold">₹{selectedCustomer.balance}</span></span>
              <button className="p-2 hover:bg-zinc-200 rounded-full"><MoreVertical className="w-5 h-5" /></button>
            </div>
          </div>

          {/* Chat Timeline */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {selectedCustomer.messages.map(msg => {
              
              if (msg.type === 'TEXT') {
                return (
                  <div key={msg.id} className={`flex flex-col w-full mb-2 ${msg.isSelf ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm relative group ${
                      msg.isSelf 
                        ? 'bg-emerald-700 text-white rounded-tr-sm' 
                        : 'bg-zinc-200 text-zinc-800 rounded-tl-sm border border-zinc-300'
                    }`}>
                      <p className="text-[15px] leading-relaxed">{msg.text}</p>
                      <div className={`flex items-center justify-end gap-1 mt-1 opacity-70 ${msg.isSelf ? 'text-emerald-200' : 'text-zinc-500'}`}>
                        <span className="text-[10px] leading-none">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.isSelf && <CheckCheck className="h-3 w-3" />}
                      </div>
                    </div>
                  </div>
                )
              }

              // Purchase or Payment
              if (msg.type === 'PURCHASE') {
                const isCancelled = msg.status === 'CANCELLED'
                return (
                  <div key={msg.id} className="flex flex-col items-start w-full mb-2">
                      <div className={`max-w-[75%] px-4 py-2 rounded-2xl rounded-tl-sm shadow-sm relative group border ${
                        isCancelled ? 'bg-zinc-50 text-zinc-400 border-zinc-200' : 'bg-zinc-200 text-zinc-900 border-zinc-200'
                      }`}>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-lg font-medium">
                          {isCancelled ? <s>₹{msg.amount}</s> : `₹${msg.amount}`}
                        </span>
                        {!isCancelled && (
                          <div className="hidden group-hover:flex items-center gap-2 absolute -right-16 top-1">
                            <button onClick={() => setEditingMsg({ id: msg.id, amount: msg.amount || 0 })} className="p-1.5 bg-zinc-200 hover:bg-zinc-700 rounded-full text-zinc-400 border border-zinc-300 shadow-lg"><Edit2 className="w-3 h-3" /></button>
                            <button onClick={() => handleDeletePurchase(msg.id)} className="p-1.5 bg-rose-900 hover:bg-rose-800 rounded-full text-rose-300 border border-rose-800 shadow-lg"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-end gap-1 mt-1 opacity-70 text-zinc-400">
                        <span className="text-[10px] leading-none">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              }

              if (msg.type === 'PAYMENT') {
                return (
                  <div key={msg.id} className="flex flex-col items-end w-full mb-4">
                    <div className="max-w-[85%] bg-emerald-700 text-white px-4 py-3 rounded-2xl rounded-tr-sm shadow-sm">
                      <p className="text-sm font-medium mb-1">
                        Payment of <span className="font-bold">₹{msg.amount}</span> is successful.
                      </p>
                      <p className="text-xs text-emerald-100/90 mb-1">
                        Customer balance updated.
                      </p>
                      <div className="text-[10px] text-emerald-200/80 mt-2 text-right">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                )
              }
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Edit Modal (Inline Overlay) */}
          {editingMsg && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-zinc-50 border border-zinc-200 p-6 rounded-xl w-80 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-zinc-900">Edit Purchase Amount</h4>
                  <button onClick={() => setEditingMsg(null)} className="text-zinc-400 hover:text-zinc-700"><X className="w-5 h-5"/></button>
                </div>
                <form onSubmit={handleEditSubmit}>
                  <input 
                    type="number" 
                    value={editingMsg.amount} 
                    onChange={e => setEditingMsg({ ...editingMsg, amount: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white border border-zinc-300 rounded-md px-4 py-2 text-zinc-900 mb-4 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-md py-2 font-medium">Save Changes</button>
                </form>
              </div>
            </div>
          )}

          {/* Chat Input */}
          <div className="p-4 bg-zinc-50 border-t border-zinc-200 shrink-0">
            <form onSubmit={handleSend} className="flex items-center gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type a message to the customer..."
                className="flex-1 bg-white border border-zinc-200 rounded-full px-5 py-3 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isSending}
                className="w-12 h-12 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 flex items-center justify-center rounded-full text-zinc-900 transition-colors"
              >
                <Send className="w-5 h-5 ml-1" />
              </button>
            </form>
          </div>
          </>
        ) : (
          <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-zinc-100 text-zinc-400 h-full">
            <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mb-4 border border-zinc-200">
              <Send className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-lg font-medium text-zinc-400">WhatsApp Web Clone</p>
            <p className="text-sm">Select a customer from the left to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  )
}
