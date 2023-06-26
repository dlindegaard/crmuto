# About
crmuto aims to automate redundant and manual CRM tasks, while also establishing a standardized approach to handling CRM data across different systems. Our project streamlines processes, enhances efficiency, and promotes seamless data exchange between CRM platforms.

The first CRM that is partially supported is [Brevo](https://www.brevo.com/).

When using crmuto, all data is handled locally on your computer and the the CRM system via the API. No data is sent to any third party.
## Current features
- **Create deals automatically from lists**
- Basic view of contacts
- Basic view of lists


# Usage

## The fundamentals
The application consists of:

1. A local proxy server that handles the communication with the CRM system.
    - The proxy server is needed to avoid CORS issues. It can either be run via Electron or as standalone Node.js applicaiton.
2. A local web server that serves the web application.
    - The web application can either be served via Electron or via an express web server. 
## Basic Development Environment
```bash
npm i
npm run dev
```
Access the application via http://localhost:3000

## Electron Application
### What is Electron?
Electron is a framework that allows you to build cross platform desktop applications using web technologies. It is based on Chromium and Node.js.
## Why Electron?

*Easy to use - handle data locally and directly with the CRM!*

Most CRM systems do not allow you to use the API directly from the browser due to CORS restrictions. Electron allows you to run a local proxy server that can communicate with the CRM system. The web application can then communicate with the proxy server without any CORS issues.

### How to run the Electron application
```bash
npm i
npm run electron
```
### How to run Electron in development mode
*This mode reloads the Electron application when changes are made to the application*
```bash
npm i
npm run electron-dev
```
### Build an Electron application
```bash
npm i
npm run electron-build
```
*The built application can be found in the `dist` folder.*

# Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

# Who is behind crmuto?
Currently the project is maintained by [Daniel Lindegaard](https://www.linkedin.com/in/dlindegaard/) @ [KUBO Robotics ApS](https://kubo.education). The company behind the KUBO robot and the revolutionary hands-on TagTile programming language.

This project is not affiliated with Brevo or any other CRM system.