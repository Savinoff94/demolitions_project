// declare module '../controllers/Crawler/Crawler' {
//     import { Browser, Page } from 'puppeteer'

//     export default class Crawler {
//         constructor(browser: Browser, page: Page)
//         goToWebsite(url: string): Promise<void>
//         moveToAddressInfo(street: string, buildingNumber: number): Promise<void>
//         getLinksElementsToDocs(): Promise<string[]>
//         goToNumberLink(number: number): Promise<void>
//         goBack(): Promise<void>
//         parseTables(): Promise<Record<string, string>[][]>
//     }
// }
// export {}
export default class Crawler {
    constructor(browser: Browser, page: Page)
    goToWebsite(url: string): Promise<void>
    moveToAddressInfo(street: string, buildingNumber: number): Promise<void>
    getLinksElementsToDocs(): Promise<string[]>
    goToNumberLink(number: number): Promise<void>
    goBack(): Promise<void>
    parseTables(): Promise<Record<string, string>[]>
}