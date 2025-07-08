### **Demolitions checker**

### Imagine finding an apartment you really like, living there for a year, planning to stay five more—only for the owner to drop the news, on the very day you’re about to renew the lease, that in seven months the building will be demolished to make way for a new one.That happened to me.

While municipalities do publish construction and demolition plans online, they’re often buried in outdated systems and written in dense legal Hebrew. Even native speakers can feel like they need a law degree just to understand what’s planned near their future home.

That’s why I thought it would be great to have such a feature on Yad2.

So, I built a web application that extracts the address from a Yad2 listing and checks whether the building is likely to be demolished, renovated, or left untouched.

### **How It Works:**

1. A Chrome extension runs on Yad2 listings.
2. It detects and extracts the address (if provided).
3. The address is sent to my backend API.
4. The API queries the Ramat Gan City Council website for construction-related documents.
5. An AI agent analyzes the data for red flags—such as the start of paperwork for renovation projects or plans to build new housing.
6. The processed result is sent back and displayed in the extension.

*This gives users a quick overview of what might happen near their future home—without needing to read through dozens of PDFs in Hebrew.*

### **Disclaimer:**

This application is currently running in development mode and uses only dummy data for demonstration purposes.

A fully functional version that works with real construction data is developed available on github and ready to use. However, due to potential legal and privacy concerns, it is not enabled.

To run the app with real data, you can:

- Insert a valid OpenAI API key
- Switch the mode from development to production

This configuration is intentionally left off by default to avoid any legal complications during public use.

### **Possible improvements:**

After testing the idea, I realized it could have some side effects. For example, landlords might stop adding addresses to their listings—or even stop using Yad2 altogether.

That’s why I think the next step should be a map-based tool that shows the risk of demolition for each building. This way:

- Renters can get the same helpful info doesnt matter which platform they use for search
- Landlords won’t be able to hide important details by just leaving out the address

<!-- ![photo_2025-06-07_17-29-09.jpg](attachment:32ad71ed-9c22-4082-97a9-811a198577f9:photo_2025-06-07_17-29-09.jpg) -->

### More detailed description

1. **Client (Chrome Extension)**

- Runs on pages like: `https://www.yad2.co.il/realestate/item/*`
- Extracts the address from the listing (if available and valid)
- Sends the address to the backend API
- Opens a WebSocket connection to receive real-time results

---

2. **Backend Entry Point**

- Checks cache / long-term storage:
    - If data already exists for the address → sends it to the results queue
- Sets a temporary cache key:
    - Prevents evaluating the same address multiple times at the same time
- Sends a message to the Scraper Queue to initiate data collection

---

3. **Scraper Worker**

- Connects to the Ramat Gan City Council website
- Searches for documents related to the address
    - Filters out anything before 2020
- Sends the collected documents to the AI Agent Queue

---

4. **AI Agent**

- Uses the following prompt to evaluate the data:
    
    > You are a real estate agent. Your goal is to assess the likelihood that a building will be demolished within the next three years, based on the data provided. Use the following scale: 0 – very unlikely, 1 – moderate chance, 2 – high probability.
    > 
- Sends the prediction to the Results Queue

---

5. **Results Delivery Worker**

- Listens for new data in the Results Queue
- Sends data back to the browser extension via WebSocket
    - The extension subscribes using a key based on the address
- Once the result is available, it is pushed to the client in real time

## System

<!-- ![demolitions_checker.jpg](attachment:701de274-5481-43bb-9c32-c10be16c52de:demolitions_checker.jpg) -->

I designed this system to handle two time-consuming tasks:

- Gathering data from municipality websites
- Evaluating the data using an AI agent

To address these bottlenecks, I built the system using Redis queues, which enable horizontal scalability and decoupling of components.

This architecture offers several benefits:

- Each component can be independently scaled based on demand
- Components can be modified or replaced without affecting others, as long as they follow the same API contracts
