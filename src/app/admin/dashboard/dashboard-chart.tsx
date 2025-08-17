'use client'

import { useState, useEffect } from 'react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, ResponsiveContainer } from "recharts"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, TrendingUp } from "lucide-react"

interface ChartDataPoint {
  month: string;
  leads: number;
  target: number;
}

const defaultChartData: ChartDataPoint[] = [
  { month: "January", leads: 186, target: 200 },
  { month: "February", leads: 305, target: 250 },
  { month: "March", leads: 237, target: 300 },
  { month: "April", leads: 273, target: 280 },
  { month: "May", leads: 209, target: 320 },
  { month: "June", leads: 214, target: 350 },
]

const chartConfig = {
  leads: {
    label: "Leads",
    color: "hsl(var(--chart-1))",
  },
  target: {
    label: "Target",
    color: "hsl(var(--chart-2))",
  },
}

export function DashboardChart() {
    const [chartData, setChartData] = useState<ChartDataPoint[]>(defaultChartData)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [totalLeads, setTotalLeads] = useState(0)
    const [growthRate, setGrowthRate] = useState(0)

    useEffect(() => {
        const fetchChartData = async () => {
            try {
                setIsLoading(true)
                setError(null)

                // Simulate API call with realistic delay
                await new Promise(resolve => setTimeout(resolve, 800))

                // Calculate total leads and growth rate
                const total = chartData.reduce((sum, item) => sum + item.leads, 0)
                const previousTotal = chartData.slice(0, -1).reduce((sum, item) => sum + item.leads, 0)
                const currentTotal = chartData.slice(-1)[0]?.leads || 0
                const growth = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0

                setTotalLeads(total)
                setGrowthRate(growth)

                // Simulate real-time data updates
                const updatedData = chartData.map(item => ({
                    ...item,
                    leads: item.leads + Math.floor(Math.random() * 20) - 10 // Small random variation
                }))

                setChartData(updatedData)
            } catch (err) {
                console.error('Error fetching chart data:', err)
                setError('Failed to load chart data')
            } finally {
                setIsLoading(false)
            }
        }

        fetchChartData()

        // Auto-refresh every 2 minutes
        const interval = setInterval(fetchChartData, 2 * 60 * 1000)

        return () => clearInterval(interval)
    }, [])

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        Lead Generation
                    </CardTitle>
                    <CardDescription>Error loading chart data</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-[200px] text-center">
                        <div>
                            <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">{error}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Please refresh the page to try again
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[200px] w-full" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="transition-all duration-200 hover:shadow-md">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Lead Generation</CardTitle>
                        <CardDescription>January - June 2024</CardDescription>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold">{totalLeads.toLocaleString()}</div>
                        <div className="flex items-center gap-1 text-sm">
                            <TrendingUp className={`h-3 w-3 ${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                            <span className={growthRate >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ChartContainer config={chartConfig} className="h-full w-full">
                            <BarChart accessibilityLayer data={chartData}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="month"
                                    tickLine={false}
                                    tickMargin={10}
                                    axisLine={false}
                                    tickFormatter={(value) => value.slice(0, 3)}
                                />
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent indicator="dot" />}
                                />
                                <Bar 
                                    dataKey="leads" 
                                    fill="var(--color-leads)" 
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={50}
                                />
                            </BarChart>
                        </ChartContainer>
                    </ResponsiveContainer>
                </div>
                
                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                    <div className="text-center">
                        <div className="text-sm font-medium text-muted-foreground">Monthly Avg</div>
                        <div className="text-lg font-bold">
                            {Math.round(totalLeads / chartData.length).toLocaleString()}
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-sm font-medium text-muted-foreground">Best Month</div>
                        <div className="text-lg font-bold">
                            {Math.max(...chartData.map(d => d.leads)).toLocaleString()}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
