export const getLinksElemntsToDocsEval = () => {

    function parseDateDDMMYYYY(dateString) {
        const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/
        const match = dateString.match(regex)

        if (!match) return false

        const day = parseInt(match[1], 10)
        const month = parseInt(match[2], 10) - 1 // JS months are 0-based
        const year = parseInt(match[3], 10)

        const date = new Date(year, month, day)

        if (
            date.getFullYear() === year &&
            date.getMonth() === month &&
            date.getDate() === day
        ) {
            return date
        }

        return null
    }

    const rows = Array.from(document.querySelectorAll('tr[role="row"]'))
    return rows.reduce((acc, row, rowIndex) => {
        if (rowIndex === 0) {
            return acc
        }
        const cells = Array.from(row.querySelectorAll('td'))
        console.log('rowIndex', rowIndex)

        let rowDate = null
        let rowLinkNumber = null
        cells.forEach((cell, index) => {
            console.log('cell', index)
            const date = parseDateDDMMYYYY(cell.innerText)

            if (date) {
                rowDate = date
                return
            }

            const linkElement = cell.querySelector(
                '[aria-label="הצגת הבקשה"]'
            )
            if (linkElement) {
                const href = linkElement?.getAttribute('href') || ''
                const match = href.match(/getRequest\((\d+)\)/)
                if(match && match[1]) {
                    rowLinkNumber = match[1]
                }
            }
        })
        if (rowDate && rowDate.getFullYear() < 2020) {
            return acc
        }
        console.log(rowLinkNumber)
        acc.push(rowLinkNumber)
        return acc
    },[])
}

export const isStreeFounlEval = (street) => {
    const elements = Array.from(
        document.querySelectorAll('.ui-menu-item-wrapper')
    )
    const target = elements.find((el) => {
        if (typeof el === "object" && el && el.textContent) {
            return el.textContent.includes(street)
        }
        return false
    })
    if (target) {
        target.click()
        return true
    }
    return false
    
}

export const goToNumberLinkEval = (number) => {
    if (typeof getRequest === 'function') {
        // prettier-ignore
        getRequest(number) // eslint-disable-line
    } else {
        throw new Error('getRequest(number) not runned')
    }
}

export const parseTablesEval = () => {
    const tables = Array.from(document.querySelectorAll('table'))
    const tableData = tables.map((table) => {
        const rows = Array.from(table.querySelectorAll('tr'))
        let headersStructure = null
        return rows.reduce((acc, row, rowIndex) => {
            if (rowIndex === 0) {
                let headers = Array.from(row.querySelectorAll('th'))
                if (headers.length === 0) {
                    headers = Array.from(row.querySelectorAll('td'))
                }
                headersStructure = headers.reduce(
                    (acc, header, headerIndex) => {
                        acc.set(headerIndex, header.innerText.trim())
                        return acc
                    },
                    new Map()
                )
                return acc
            }

            const cells = Array.from(row.querySelectorAll('td'))
            const rowData = cells.reduce((acc, cell, index) => {
                acc[headersStructure.get(index)] = cell.innerText.trim()
                return acc
            }, {})
            acc.push(rowData)
            return acc
        }, [])
    })
    return tableData
}