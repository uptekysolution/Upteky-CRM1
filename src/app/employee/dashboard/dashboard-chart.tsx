'use client'

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

const chartData = [
  { month: "January", leads: 186 },
  { month: "February", leads: 305 },
  { month: "March", leads: 237 },
  { month: "April", leads: 73 },
  { month: "May", leads: 209 },
  { month: "June", leads: 214 },
]

const chartConfig = {
  leads: {
    label: "Leads",
    color: "hsl(var(--chart-1))",
  },
}

export function DashboardChart() {
    return (
        <Card>
            <CardHeader>
            <CardTitle>Lead Generation</CardTitle>
            <CardDescription>January - June 2024</CardDescription>
            </CardHeader>
            <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <BarChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
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
                <Bar dataKey="leads" fill="var(--color-leads)" radius={4} />
                </BarChart>
            </ChartContainer>
            </CardContent>
        </Card>
    )
}
