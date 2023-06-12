# Lami Account

A lambda application containing multiple functions that help with the organisazation's authentication and user management. Also serves as a template to write simple serverless function for Lambda and Cloud functinos

Disclaimer: Used this to understand the framwork nestjs and how to use it to make a serverless application that works with AWS cognito

## Content

1. [Background](#background)
2. [Compile the code](#compile-the-code)
3. [Authentication flow](#authentication-flow)
4. [SDK Client](#sdk-client)

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

## Authentication flow

The auth follows the following steps consists of the following steps; _register, login, change password, verify_token_

### Auth function example

Using javascript [aws-sdk](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-lambda/classes/invokecommand.html) we'll cover how to register a user

```typescript
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const client = new LambdaClient({
    FunctionName: "test-function",
    Payload: {
    "eventType": "REGISTER",
    "data": {
        "email": "example@lami.world" 
        }
    }
});
const command = new InvokeCommand(input);
const response = await client.send(command);
```

If the user invocation was successful use you'll get the following response from the aws lambda and recieve an email with a temporary password

```json
{
    "$metadata": {
        "httpStatusCode": 200,
        "requestId": "dce3e747-18fb-4537-adda-3ead41ce9b34",     
        "attempts": 1,
        "totalRetryDelay": 0
    },
    "User": {
        "Attributes": [
            {
                "Name": "sub",
                "Value": "b8aa8a5a-a66c-4e81-b42e-4b95baf0a1a2"  
            },
            {
                "Name": "email",
                "Value": "example@lami.world"
            }
        ],
        "Enabled": true,
        "UserCreateDate": "2022-09-12T23:13:55.143Z",
        "UserLastModifiedDate": "2022-09-12T23:13:55.143Z",      
        "UserStatus": "FORCE_CHANGE_PASSWORD",
        "Username": "b8aa8a5a-a66c-4e81-b42e-4b95baf0a1a2"
    }
}
```

Now we'll login the user

```typescript
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const client = new LambdaClient({
    FunctionName: "test-function",
    Payload: {
    "eventType": "LOGIN",
    "data": {
        "email": "example@lami.world",
        "password": "Qk:RM8UL"
      
        }
    }
});
const command = new InvokeCommand(input);
const response = await client.send(command);
```

If the user was newly created they will be forced to change the temporary password.By which you'll get the following response

```json
{
    "$metadata": {
        "httpStatusCode": 200,
        "requestId": "471ee9ef-abd4-438a-98cc-d202cb000964",
        "attempts": 1,
        "totalRetryDelay": 0
    },
    "ChallengeName": "NEW_PASSWORD_REQUIRED",
    "ChallengeParameters": {
        "USER_ID_FOR_SRP": "b8aa8a5a-a66c-4e81-b42e-4b95baf0a1a2",
        "requiredAttributes": "[]",
        "userAttributes": "{\"email\":\"example@gmail.com\"}"
    },
    "Session": "AYABeAISbs-nHSKDJPKN2WgCZh8AHQABAAdTZXJ2aWNlABBDb2duaXRvVXNlclBvb2xzAAEAB2F3cy1rbXMAS2FybjphZkZmM1MWM3NzFhYQC4AQIBAHigzwqzlp0D8sA0ltw8SHdsZPaJakxa-4NzPukgGo7dmgGgk6bInk9n9yvI75azZtxoAAAAfjB8BgkqhkiG9wLvRQ8fWvPaxI-LZleZcPCUdgnkCCMrQsQbfNFOf5s-J_3RkuglnZoWJwavVMo4ehvT97dtf5WgjFrQIAAAAADAAAEAAAAAAAAAAAAAAAAABVXthMVqpgrxWvk-cUMVQrOIR2WZrg14BLnT4rbAAZSUG42i9uz1w6oDSMlDKAosqgdL-bgd7Gyj6MPj4rMuE3JPV7K8l6PDlAzVH0DFsyr5AD1UmJOE9LlEqKHiykHCQAg8xzc-ubI0uSzf3PlWsIwZXyEv76OpS-DnnttJPMdgmfTwwDQz9j28FxbpzNtYRYmJC3abKCfw"
}
```

We'll use the **session** we got from the earlier invocation to change the users password

```typescript
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const client = new LambdaClient({
    FunctionName: "test-function",
    Payload: {
    "eventType": "REQUIRED_CHANGE_PASSWORD",
    "data": {
        "email": "example@gmail.com",
        "password": "Qk:RM8UL",
        "new_password": "Password@309"
      
        },
        "CHALLENGE_SESSION": "AYABeAISbs-nHSKDJPKN2WgCZh8AHQABAAdTZXJ2aWNlABBDb2duaXRvVXNlclBvb2xzAAEAB2F3cy1rbXMAS2Fybjphd3M6a21zOmV1LXdlc3QtMTo0NTU0NTg0OTMwODE6a2V5L2FiN2U3M2UzLWU2NDEtNDk5Zi1iNzc0LWZkZmM1MWM3NzFhYQC4AQIBAHigzwqzlp0D8sA0ltw8SHdsZPaJakxa-4NzPukgGo7dmgGgk6bInk9n9yvI75azZtxoAAAAfjB8BgkqhkiG9w0BBwagbzBtAgEAMGgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMZO39YHOZQx6taPloAgEQgDtOLvRQ8fWvPaxI-LZleZcPCUdgnkCCMrQsQbfNFOf5s-J_3RkuglnZoWJwavVMo4ehvT97dtf5WgjFrQIAAAAADAAAEAAAAAAAAAAAAAAAAABVfjRe2QxqaTJobyoKG7fZ_____wAAAAEAAAAAAAAAAAAAAAEAAADV16DtZcvQIocEKMNeRCXppE3dzjXthMVqpgrxWvk-cUMVQrOIR2WZrg14BLnT4rbAAZSUG42i9uz1w6oDSMlDKAosqgdL-bgd7Gyj6MPj4rMuE3JPV7K8l6PDlAzVH0DFsyr5ADCqjsIxI-qM_2izxdgT2SnIM7K1jsLFMej89foCLtQct6eAAUsWmDAKXvCgh6tMsj4FOuyjn-VP6AyF1UmJOE9LlEqKHiykHCQAg8xzc-ubI0uSzf3PlWsIwZXyEv76OpS-DnnttJPMdgmfTwwDQz9j28FxbpzNtYRYmJC3abKCfw"
    }
});
const command = new InvokeCommand(input);
const response = await client.send(command);
```

Then you should get the following response complete with various tokens. We could use to Identify the user or the app client. The following response is also recieved during login if the user does not have any authentication challenges such as **REQUIRED_CHANGE_PASSWORD**

```json
{
    "$metadata": {
        "httpStatusCode": 200,
        "requestId": "56ba4cb4-968d-438d-8434-ae59dedccceb",
        "attempts": 1,
    },
    "AuthenticationResult": {
        "AccessToken": "eyJraWQiOiJVN3ROK0NmMGtpa2hpUVpQelJsNW1LR2h2S09vYXBvVjBOemFqQnBFZU9rPSIsImFsZyI6IlJTJodHRwczpcL1wvY29nbml0by1pZHAuZXUtd2VzdC0xLmFtYXpvbmF3cy5jb21cL2V1LXdlc3QtMV95bmRKWUtXVDQiLCJjbGllbnRfaWQiOiOTgtYWI4My0zZTJiZjhkOTc1NjUiLCJldmVudF9pZCI6IjU2YmE0Y2I0LTk2OGQtNDM4ZC04NDM0LWFlNTlkZWRjY2NlYiIsInRva2VuX3VzRpbWUiOjE2NjMwMjQ3NDIsImV4cCI6MTY2MzAyODM0MiwiaWF0IjoxNjYzMDI0NzQyLCJqdGkiOiI3N2U1NTMyNy05OGNmLTQyOTctODY4YiYTFhMiJ9.BGCw9OTr-DkTv1P1WPivCq8tPHuL14wSZJeEb3PTVayYzCgD7KV_WenZGf_kEuz8XuwZjf9ZT7GKA0r_Az7Wr-g17cjHpyN3MOQfjbp8oGqvaBIuaPIa4bFUBu51DVduYtpy_S4ciWQzL-JsTIlqNleCE_-W4yNEjmE4Pg8Vh6Wx79x_U-XCt3I8ED2lNTPA3COsgxP5vStOTSV
        "ExpiresIn": 3600,
        "IdToken": "eyJraWQiOiJNZnkwY29qblwvVjczTUNjVW5VNGpDUlwvYkhYZUc1c1h3cWkrSU1UTVFEY1k9IiwiYWxnIjoiUlMyodHRwczpcL1wvY29nbml0by1pZHAuZXUtd2VzdC0xLmFtYXpvbmF3cy5jb21cL2V1LXdlc3QtMV95bmRKWUtXVDQiLCJjb2duaXRvOnVzZXJjlmNGQ4N2VkLWQzNWEtNDA5OC1hYjgzLTNlMmJmOGQ5NzU2NSIsImF1ZCI6IjNiN2dqYmpydGh1MWxiajlxYzgxZmRraG5yIiwiZXZlbnRfasImF1dGhfdGltZSI6MTY2MzAyNDc0MiwiZXhwIjoxNjYzMDI4MzQyLCJpYXQiOjE2NjMwMjQ3NDIsImp0aSI6IjUyYjEwZDEwLWZmNjgtNDMnn9VmiVmgzMIitIOqexlPvi7L2m4lPuI1dOmWYNR0gZqeakbtby4L4GQ-OcAcDIHKG42WVHJkZQsYjuHuGLWS4OOULiBANRqFTq5uS02LdXSG7lekUI3ma5MtDWjWPeNzRQOUUQ9BZ9dZ_XSTqDJWLc3fLaEB5es8ucaI9eRkCZd3HufZicvV2DZE3uWNESQg_tYvq30taf2pNweI-yeQil8
        "RefreshToken": "eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAifQ.My_S8-yGuGx0uPh10rfoxmG-bDgiaeC8CqVHasJ8YHeiY5kUkITG252L06rG2PjkIxYKHyiPZFoR-jljFv7OaX0cSvw0pQCDi-0eno4v__aHUcNdlo_I3wivxf2G3QNNhECQ27I3-tjA52SwaO3CXygVc0oFTLOl7m4eUAVwU-Yr0I1x2ASbwma6aQ.oxUwJsgTpP_6dSUw.LU7e8AGsbTrO91ujFtsjPbPBELiVa5_mMe3Wr388HZIMliCVQB0zfUJcCn36PqwDVKtuKhTYxhYW2qoj6NxSvGKbkCF1hYogpdem8W05vSrdXdwCxU1MlNlfs6yJpXWaRsteOoTe-nyLGEqV2jIh1qMUWmoxXJCzANSoo-4n77oD_zH9Hooaj7wNgVQYGr2DPoCoRCmeyGpsfoYFPejlgwp1EC5BMLwdaBOfLbJpVE6ZJAgH-FKbxywxmYlJ-dgGhtt-iHjC6eAc-NhRS1lU4k3jUCe2fuLqaxBpdJHU2h2e_CJ6kXtpl-MGWaqGT8_zIqLgY_7T_XSIAH5Q54xUwZNoWIhzenie4zA2gRlfMKPAoxATKYDQk_xRLiO52NfRsCCpG7_8kZDCWonP4wXxkIrmqX0fStgCwqvDS5NMmdGfIrL40sZoMMiL7hNVf3QV0GDrrpnzmeO4oHDKInKYmORBzYMxkDruBCb3oJB5Jwn77BSpZo_G5maWL3stPgX_3A_xkV0lo5PCgCjWHlHe-QUZWvq8zZufRVjeLTaYnLizD02DUK4tgzWl0sU2_-EHQcypD98Pol0I7wrEj3nOFhAArz8uAafTm8PiV_LLnYnqhGX-AKtNZ-IrDHxkBJXv1XdPECRSVg7rGD86rH9oOR7GkY6JG4PKOwdx8PsR
        "TokenType": "Bearer"
    },
    "ChallengeParameters": {}
}
```

Then we can user can verify the various tokens we got.

```typescript
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const client = new LambdaClient({
    FunctionName: "test-function",
    Payload: {{
    "eventType": "VERIFY_TOKEN",
    "data": {
        "token": "eyJraWQiOiJVN3ROK0NmMGtpa2hpUVpQelJsNW1LR2h2S09vYXBvVjBOemFqQnBFZU9rPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiJiOGFhOGE1YS1hNjZjLTRlODEtYjQyZS00Yjk1YmFmMGExYTIiLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAuZXUtd2VzdC0xLmFtYXpvbmF3cy5jb21cL2V1LXdlc3QtMV95bmRKWUtXVDQiLCJjbGllbnRfaWQiOiIzYjdnamJqcnRodTFsYmo5cWM4MWZka2huciIsIm9yaWdpbl9qdGkiOiI5ZjRkODdlZC1kMzVhLTQwOTgtYWI4My0zZTJiZjhkOTc1NjUiLCJldmVudF9pZCI6IjU2YmE0Y2I0LTk2OGQtNDM4ZC04NDM0LWFlNTlkZWRjY2NlYiIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiYXdzLmNvZ25pdG8uc2lnbmluLnVzZXIuYWRtaW4iLCJhdXRoX3RpbWUiOjE2NjMwMjQ3NDIsImV4cCI6MTY2MzAyODM0MiwiaWF0IjoxNjYzMDI0NzQyLCJqdGkiOiI3N2U1NTMyNy05OGNmLTQyOTctODY4Yi0zYjY3NWYxYjJmY2MiLCJ1c2VybmFtZSI6ImI4YWE4YTVhLWE2NmMtNGU4MS1iNDJlLTRiOTViYWYwYTFhMiJ9.BGCw9OTr-DkTv1P1WPivCq8tPHuL14wSZJeEb3PTVayYzCgD7KV_WenZGf_kEuz8XuwZjf9ZT7GKA0r_Az7Wr-g17cjHpyN3MOQeaT9yUE34v62T3wHKL9NsErOKJAyucCBNZG_Kv8vJZ625V76NFVU8dwRxeFHpDreTh6f1rkm3OgBPafjbp8oGqvaBIuaPIa4bFUBu51DVduYtpy_S4ciWQzL-JsTIlqNleCE_-W4yNEjmE4Pg8Vh6Wx79x_U-XCt3I8ED2lNTPA3COsgxP5vStOTSV17by8EpNsDvkgc9nobPKDeRoANl9Rd3Xruk27HqhGkO-Vxs63JeMKR7fw",
        // this is used to verify a user profile change the type to 'access' to verify an application client
        "type": "id"  
        }
    }
});
const command = new InvokeCommand(input);
const response = await client.send(command);
```

The response might look like this. The **username** object is the main user identifier

```json
{
    "sub": "b8aa8a5a-a66c-4e81-b42e-4b95baf0a1a2",
    "iss": "https://cognito-idp.eu-west-1.amazonaws.com/eu-west-1_12345",
    "client_id": "3b7gjbjrthu1lbj9qc81fdkhnr",
    "origin_jti": "9f4d87ed-d35a-4098-ab83-3e2bf8d97565",
    "event_id": "56ba4cb4-968d-438d-8434-ae59dedccceb",
    "token_use": "access",
    "scope": "aws.cognito.signin.user.admin",
    "auth_time": 1663024742,
    "exp": 1663028342,
    "iat": 1663024742,
    "jti": "77e55327-98cf-4297-868b-3b675f1b2fcc",
    "username": "b8aa8a5a-a66c-4e81-b42e-4b95baf0a1a2"
}
```

## CLient SDK
Using AWS lambda client SDK is one way to interact withe serverless function demonstrated here. However the following SDK will abstract most the setup and functionality.
