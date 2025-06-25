class Crawler {

    constructor(browser, page) {
        this.browser = browser
        this.page = page
    }

    goToWebsite = async (url) => {
        await this.page.goto(url, {
            waitUntil: 'networkidle2',
        })
    }

    moveToAddressInfo = async (street, buildingNumber) => {
        await this.page.waitForSelector('#C_RequestByAddressGRP', {
            visible: true,
        })
        // select search by building address
        await this.page.click('#C_RequestByBuildingGRP')
        await this.page.click('#C_RequestByAddressGRP')

        await this.page.waitForSelector('#RequestHouseNum', {
            visible: true,
        })

        // Street number
        await this.page.click('#RequestStreet')
        await this.page.keyboard.type(street)
        // must select street from dropdown which open on user input
        const isStreetFound = await this.page.evaluate((street) => {
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
            
        }, street)

        if (!isStreetFound) {
            throw new Error('cant find street')
        }

        // Building number
        await this.page.click('#RequestHouseNum')
        await this.page.keyboard.type(String(buildingNumber))

        await this.page.click('#btnShow')
    }

    getLinksElementsToDocs = async () => {
        return await this.page.evaluate(() => {

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
        })
    }

    goToNumberLink = async (number) => {
        await this.page.waitForSelector('select[name="results-table_length"]')
        await this.page.evaluate((number) => {
            if (typeof getRequest === 'function') {
                // prettier-ignore
                getRequest(number) // eslint-disable-line
            } else {
                throw new Error('getRequest(number) not runned')
            }
        }, number)
        await this.page.waitForSelector('h3.result-title')
    }

    goBack = async () => {
        await this.page.goBack()
        await this.page.waitForSelector('#results-table_length')
    }

    parseTables = async () => {
        await this.page.waitForSelector('table')
        return await this.page.evaluate(() => {
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
        })
    }
}

export default Crawler
