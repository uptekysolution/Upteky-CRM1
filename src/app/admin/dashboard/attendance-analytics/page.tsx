'use client'

import React, { useState, useEffect } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function AdminAnalyticsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid))
          if (userDoc.exists()) {
            const data = userDoc.data()
            setUserData({
              role: data.role || 'Employee',
              teamId: data.teamId || null,
              name: data.name || data.email || 'Unknown',
              email: data.email || ''
            })
          } else {
            setUserData({ role: 'Employee', name: 'Unknown', email: user.email || '' })
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
          setUserData({ role: 'Employee', name: 'Unknown', email: user.email || '' })
        }
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading analytics...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Please log in to view analytics</p>
        </CardContent>
      </Card>
    )
  }

  if (userData?.role !== 'Admin' && userData?.role !== 'Sub-Admin') {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-red-600">Access denied. Admin privileges required.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <AnalyticsDashboard 
        userRole={userData.role}
        userId={user.uid}
        teamId={userData.teamId}
      />
    </div>
  )
}
