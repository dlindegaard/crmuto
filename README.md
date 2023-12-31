# About
crmuto aims to automate redundant and manual CRM tasks, while also establishing a standardized approach to handling CRM data across different systems. Our project streamlines processes, enhances efficiency, and promotes seamless data exchange between CRM platforms.

The first CRM that is partially supported is [Brevo](https://www.brevo.com/).

When using crmuto, all data is handled between your local computer and the CRM system via the API. No data is sent to any third party.
## Current features
### Version 0.8
- Changed the way naming of deals are handled. Now the deal will have the name of the contact unless a the contact has no name, in which case the deal will be "New deal"
- Fixed retrieval of lists from Brevo
### Version 0.7
- Fixed bug related to creating deals (first occurrence after V0.6)
- Added new filter option for attributes (Not empty)
### Version 0.6
- Add contacts to lists
### Version 0.5
- Added filtering by attribute(s) (this filter requires that you also filter by list)
### Version 0.4
- Application code (app.ts) is prepared for multiple CRM systems
### Version 0.3
- Pipelines view added
- When creating deals, you now choose a pipeline and stage
- Bugfix: Contacts view now shows the correct total number of contacts

### Version 0.2
- Filter contacts by multiple lists (in or not in)
- Create deals for the filtered contacts
- Minor improvements:
    - Context specific loading text (e.g. "Loading contacts" instead of "Creating deals")
    - Better visuals for confirm and alert boxes
    - Changed User interface to Contact

### Version 0.1
- Create deals automatically from lists
- Basic view of contacts
- Basic view of lists

## Overall structure of the application
The application consists of:

1. A local proxy server that handles the communication with the CRM system.
    - The proxy server is needed to avoid CORS issues. It can either be run via Electron or as standalone Node.js applicaiton.
2. A local web server that serves the web application.
    - The web application can either be served via Electron or via an express web server. 
# Usage
## Pre-requisites
Make sure you have Node.js, npm, and TypeScript installed.

Installing TypeScript globally:
```bash
npm i -g typescript
```
## Option 1: Basic Development Environment
```bash
npm i
npm run dev
```
Access the application via http://localhost:3000

## Option 2: Electron Application
Electron is a framework that allows you to build cross platform desktop applications using web technologies. It is based on Chromium and Node.js.

**Why Electron?**

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