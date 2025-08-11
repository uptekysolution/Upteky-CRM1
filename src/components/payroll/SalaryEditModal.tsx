'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { updateEmployeeSalary, SalaryUpdate } from '@/lib/payroll'
import { Edit } from 'lucide-react'

interface SalaryEditModalProps {
  userId: string
  employeeName: string
  currentSalaryType: 'monthly' | 'daily'
  currentSalaryAmount: number
  onSalaryUpdated: () => void
}

export function SalaryEditModal({
  userId,
  employeeName,
  currentSalaryType,
  currentSalaryAmount,
  onSalaryUpdated
}: SalaryEditModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [salaryType, setSalaryType] = useState<'monthly' | 'daily'>(currentSalaryType)
  const [salaryAmount, setSalaryAmount] = useState(currentSalaryAmount.toString())
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!salaryAmount || parseFloat(salaryAmount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid salary amount",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const salaryData: SalaryUpdate = {
        salaryType,
        salaryAmount: parseFloat(salaryAmount)
      }

      await updateEmployeeSalary(userId, salaryData)
      
      toast({
        title: "Success",
        description: "Salary updated successfully",
      })
      
      onSalaryUpdated()
      setOpen(false)
    } catch (error) {
      console.error('Error updating salary:', error)
      toast({
        title: "Error",
        description: "Failed to update salary. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && loading) return // Prevent closing while loading
    setOpen(newOpen)
    
    if (newOpen) {
      // Reset form when opening
      setSalaryType(currentSalaryType)
      setSalaryAmount(currentSalaryAmount.toString())
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="mr-2 h-4 w-4" />
          Edit Salary
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Salary - {employeeName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="salaryType">Salary Type</Label>
            <Select value={salaryType} onValueChange={(value: 'monthly' | 'daily') => setSalaryType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select salary type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="salaryAmount">Salary Amount</Label>
            <Input
              id="salaryAmount"
              type="number"
              step="0.01"
              min="0"
              value={salaryAmount}
              onChange={(e) => setSalaryAmount(e.target.value)}
              placeholder="Enter salary amount"
              required
            />
            <p className="text-sm text-muted-foreground">
              {salaryType === 'monthly' ? 'Monthly salary amount' : 'Daily rate amount'}
            </p>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Salary'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
