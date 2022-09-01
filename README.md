# Lami Account

A lambda application containing multiple functions that help with Lami's authentication and user management

## Requirements
- NodeJs v18.7.0.
## Installation

Use the package manager [npm](https://docs.npmjs.com/getting-started) to install the microservices dependencies.

```bash
npm install
```
## Background
This is a project consisting of multiple functions to be deployed and invoked on [AWS Lambda](https://aws.amazon.com/lambda/).
It is build on (NestJS)[https://nestjs.com/]

## Compile the code.
To build a function run the following command `npm run build <function-name>`
```bash
npm run build auth
```

This will generate the **dist/apps/auth/main.js** handler file
## Event templates location
1. Auth: apps/auth/event-templates 
