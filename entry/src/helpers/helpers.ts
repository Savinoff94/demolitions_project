export const getMonthsAgo = (months: number): Date => {
    const date = new Date()
    date.setMonth(date.getMonth() - months)
    return date
}