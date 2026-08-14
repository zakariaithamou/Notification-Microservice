# NMS - API Contract

## 1. Department Management Feature

| Method    | Endpoint                        | Description                                         |
| :-------- | :------------------------------ | :-------------------------------------------------- |
| **POST**  | `/api/departments`              | Register a new department and generate its API key. |
| **GET**   | `/api/departments`              | List all registered departments.                    |
| **GET**   | `/api/departments/{id}`         | Retrieve information about a specific department.   |
| **PATCH** | `/api/departments/{id}`         | Update a department's information.                  |
| **PATCH** | `/api/departments/{id}/status`  | Activate or deactivate a department.                |
| **POST**  | `/api/departments/{id}/api-key` | Generate or regenerate a department's API key.      |

## 2. Template Management Feature

| Method    | Endpoint              | Description                         |
| :-------- | :-------------------- | :---------------------------------- |
| **POST**  | `/api/templates`      | Create a new notification template. |
| **GET**   | `/api/templates`      | List all templates.                 |
| **GET**   | `/api/templates/{id}` | Retrieve a specific template.       |
| **PATCH** | `/api/templates/{id}` | Update a template.                  |

## 3. Notification Dispatch & Tracking Feature

| Method    | Endpoint                        | Description                                                                 |
| :-------- | :------------------------------ | :-------------------------------------------------------------------------- |
| **POST**  | `/api/notifications`            | Submit a new notification request.                                          |
| **GET**   | `/api/notifications`            | List notification history (supports filtering by department, status, etc.). |
| **GET**   | `/api/notifications/{id}`       | Retrieve the status of a specific notification.                             |
| **PATCH** | `/api/notifications/{id}`       | Update notification information or status.                                  |
| **POST**  | `/api/notifications/{id}/retry` | Retry sending a failed notification.                                        |

# NMS - API Contract

## Request/Response Payloads & Status Codes

---

### 1. Department Management Feature

#### 1.1 POST `/api/departments`

**Description:** Register a new department and generate its API key.

| Aspect                       | Details                                                                                                                                                                           |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Request Body**             | `application/json`                                                                                                                                                                |
| **Request Payload**          | `{ "name": "string", "description": "string", "contactEmail": "string" }`                                                                                                         |
| **Response 201 Created**     | `{ "id": "uuid", "name": "string", "description": "string", "contactEmail": "string", "apiKey": "string", "status": "active", "createdAt": "ISO-8601", "updatedAt": "ISO-8601" }` |
| **Response 400 Bad Request** | `{ "error": "VALIDATION_ERROR", "message": "Invalid request payload", "details": [...] }`                                                                                         |
| **Response 409 Conflict**    | `{ "error": "DUPLICATE_NAME", "message": "Department name already exists" }`                                                                                                      |

---

#### 1.2 GET `/api/departments`

**Description:** List all registered departments.

| Aspect              | Details                                                                                                                                                                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Request Body**    | None                                                                                                                                                                                                                                                   |
| **Query Params**    | `?page=1&limit=20&status=active` (optional)                                                                                                                                                                                                            |
| **Response 200 OK** | `{ "data": [ { "id": "uuid", "name": "string", "description": "string", "contactEmail": "string", "status": "active", "createdAt": "ISO-8601", "updatedAt": "ISO-8601" } ], "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 } }` |

---

#### 1.3 GET `/api/departments/{id}`

**Description:** Retrieve information about a specific department.

| Aspect                     | Details                                                                                                                                                                           |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Request Body**           | None                                                                                                                                                                              |
| **Path Param**             | `id: uuid`                                                                                                                                                                        |
| **Response 200 OK**        | `{ "id": "uuid", "name": "string", "description": "string", "contactEmail": "string", "apiKey": "string", "status": "active", "createdAt": "ISO-8601", "updatedAt": "ISO-8601" }` |
| **Response 404 Not Found** | `{ "error": "NOT_FOUND", "message": "Department not found" }`                                                                                                                     |

---

#### 1.4 PATCH `/api/departments/{id}`

**Description:** Update a department's information.

| Aspect                       | Details                                                                                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Request Body**             | `application/json`                                                                                                                                            |
| **Request Payload**          | `{ "name": "string", "description": "string", "contactEmail": "string" }` (all optional)                                                                      |
| **Path Param**               | `id: uuid`                                                                                                                                                    |
| **Response 200 OK**          | `{ "id": "uuid", "name": "string", "description": "string", "contactEmail": "string", "status": "active", "createdAt": "ISO-8601", "updatedAt": "ISO-8601" }` |
| **Response 400 Bad Request** | `{ "error": "VALIDATION_ERROR", "message": "Invalid request payload", "details": [...] }`                                                                     |
| **Response 404 Not Found**   | `{ "error": "NOT_FOUND", "message": "Department not found" }`                                                                                                 |
| **Response 409 Conflict**    | `{ "error": "DUPLICATE_NAME", "message": "Department name already exists" }`                                                                                  |

---

#### 1.5 PATCH `/api/departments/{id}/status`

**Description:** Activate or deactivate a department.

| Aspect                       | Details                                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------- |
| **Request Body**             | `application/json`                                                                    |
| **Request Payload**          | `{ "status": "active" \| "inactive" }`                                                |
| **Path Param**               | `id: uuid`                                                                            |
| **Response 200 OK**          | `{ "id": "uuid", "name": "string", "status": "active", "updatedAt": "ISO-8601" }`     |
| **Response 400 Bad Request** | `{ "error": "VALIDATION_ERROR", "message": "Status must be 'active' or 'inactive'" }` |
| **Response 404 Not Found**   | `{ "error": "NOT_FOUND", "message": "Department not found" }`                         |

---

#### 1.6 POST `/api/departments/{id}/api-key`

**Description:** Generate or regenerate a department's API key.

| Aspect                     | Details                                                                           |
| -------------------------- | --------------------------------------------------------------------------------- |
| **Request Body**           | None                                                                              |
| **Path Param**             | `id: uuid`                                                                        |
| **Response 200 OK**        | `{ "id": "uuid", "name": "string", "apiKey": "string", "updatedAt": "ISO-8601" }` |
| **Response 404 Not Found** | `{ "error": "NOT_FOUND", "message": "Department not found" }`                     |

---

### 2. Template Management Feature

#### 2.1 POST `/api/templates`

**Description:** Create a new notification template.

| Aspect                       | Details                                                                                                                                                                 |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Request Body**             | `application/json`                                                                                                                                                      |
| **Request Payload**          | `{ "name": "string", "subject": "string", "body": "string", "type": "email" \| "sms" \| "push", "variables": ["string"] }`                                              |
| **Response 201 Created**     | `{ "id": "uuid", "name": "string", "subject": "string", "body": "string", "type": "email", "variables": ["string"], "createdAt": "ISO-8601", "updatedAt": "ISO-8601" }` |
| **Response 400 Bad Request** | `{ "error": "VALIDATION_ERROR", "message": "Invalid request payload", "details": [...] }`                                                                               |
| **Response 409 Conflict**    | `{ "error": "DUPLICATE_NAME", "message": "Template name already exists" }`                                                                                              |

---

#### 2.2 GET `/api/templates`

**Description:** List all templates.

| Aspect              | Details                                                                                                                                                                                                                                       |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Request Body**    | None                                                                                                                                                                                                                                          |
| **Query Params**    | `?page=1&limit=20&type=email` (optional)                                                                                                                                                                                                      |
| **Response 200 OK** | `{ "data": [ { "id": "uuid", "name": "string", "subject": "string", "type": "email", "variables": ["string"], "createdAt": "ISO-8601", "updatedAt": "ISO-8601" } ], "pagination": { "page": 1, "limit": 20, "total": 50, "totalPages": 3 } }` |

---

#### 2.3 GET `/api/templates/{id}`

**Description:** Retrieve a specific template.

| Aspect                     | Details                                                                                                                                                                 |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Request Body**           | None                                                                                                                                                                    |
| **Path Param**             | `id: uuid`                                                                                                                                                              |
| **Response 200 OK**        | `{ "id": "uuid", "name": "string", "subject": "string", "body": "string", "type": "email", "variables": ["string"], "createdAt": "ISO-8601", "updatedAt": "ISO-8601" }` |
| **Response 404 Not Found** | `{ "error": "NOT_FOUND", "message": "Template not found" }`                                                                                                             |

---

#### 2.4 PATCH `/api/templates/{id}`

**Description:** Update a template.

| Aspect                       | Details                                                                                                                                                                 |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Request Body**             | `application/json`                                                                                                                                                      |
| **Request Payload**          | `{ "name": "string", "subject": "string", "body": "string", "type": "email" \| "sms" \| "push", "variables": ["string"] }` (all optional)                               |
| **Path Param**               | `id: uuid`                                                                                                                                                              |
| **Response 200 OK**          | `{ "id": "uuid", "name": "string", "subject": "string", "body": "string", "type": "email", "variables": ["string"], "createdAt": "ISO-8601", "updatedAt": "ISO-8601" }` |
| **Response 400 Bad Request** | `{ "error": "VALIDATION_ERROR", "message": "Invalid request payload", "details": [...] }`                                                                               |
| **Response 404 Not Found**   | `{ "error": "NOT_FOUND", "message": "Template not found" }`                                                                                                             |
| **Response 409 Conflict**    | `{ "error": "DUPLICATE_NAME", "message": "Template name already exists" }`                                                                                              |

---

### 3. Notification Dispatch & Tracking Feature

#### 3.1 POST `/api/notifications`

**Description:** Submit a new notification request.

| Aspect                       | Details                                                                                                                                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Request Body**             | `application/json`                                                                                                                                                                                     |
| **Request Payload**          | `{ "departmentId": "uuid", "templateId": "uuid", "recipients": ["string"], "variables": { "key": "value" }, "channel": "email" \| "sms" \| "push", "scheduledAt": "ISO-8601" }` (scheduledAt optional) |
| **Response 202 Accepted**    | `{ "id": "uuid", "departmentId": "uuid", "templateId": "uuid", "status": "pending", "recipients": ["string"], "channel": "email", "scheduledAt": "ISO-8601", "createdAt": "ISO-8601" }`                |
| **Response 400 Bad Request** | `{ "error": "VALIDATION_ERROR", "message": "Invalid request payload", "details": [...] }`                                                                                                              |
| **Response 404 Not Found**   | `{ "error": "NOT_FOUND", "message": "Department or Template not found" }`                                                                                                                              |

---

#### 3.2 GET `/api/notifications`

**Description:** List notification history (supports filtering).

| Aspect              | Details                                                                                                                                                                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Request Body**    | None                                                                                                                                                                                                                                                                      |
| **Query Params**    | `?page=1&limit=20&departmentId=uuid&status=pending&channel=email&from=ISO-8601&to=ISO-8601` (all optional)                                                                                                                                                                |
| **Response 200 OK** | `{ "data": [ { "id": "uuid", "departmentId": "uuid", "templateId": "uuid", "status": "sent", "recipients": ["string"], "channel": "email", "sentAt": "ISO-8601", "createdAt": "ISO-8601" } ], "pagination": { "page": 1, "limit": 20, "total": 200, "totalPages": 10 } }` |

---

#### 3.3 GET `/api/notifications/{id}`

**Description:** Retrieve the status of a specific notification.

| Aspect                     | Details                                                                                                                                                                                                                                                                                                                     |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Request Body**           | None                                                                                                                                                                                                                                                                                                                        |
| **Path Param**             | `id: uuid`                                                                                                                                                                                                                                                                                                                  |
| **Response 200 OK**        | `{ "id": "uuid", "departmentId": "uuid", "templateId": "uuid", "status": "sent", "recipients": ["string"], "channel": "email", "variables": { "key": "value" }, "logs": [ { "status": "sent", "timestamp": "ISO-8601", "message": "string" } ], "scheduledAt": "ISO-8601", "sentAt": "ISO-8601", "createdAt": "ISO-8601" }` |
| **Response 404 Not Found** | `{ "error": "NOT_FOUND", "message": "Notification not found" }`                                                                                                                                                                                                                                                             |

---

#### 3.4 PATCH `/api/notifications/{id}`

**Description:** Update notification information or status.

| Aspect                       | Details                                                                                      |
| ---------------------------- | -------------------------------------------------------------------------------------------- |
| **Request Body**             | `application/json`                                                                           |
| **Request Payload**          | `{ "status": "cancelled", "scheduledAt": "ISO-8601" }` (limited fields)                      |
| **Path Param**               | `id: uuid`                                                                                   |
| **Response 200 OK**          | `{ "id": "uuid", "status": "cancelled", "updatedAt": "ISO-8601" }`                           |
| **Response 400 Bad Request** | `{ "error": "VALIDATION_ERROR", "message": "Cannot update notification in current status" }` |
| **Response 404 Not Found**   | `{ "error": "NOT_FOUND", "message": "Notification not found" }`                              |
| **Response 409 Conflict**    | `{ "error": "STATE_CONFLICT", "message": "Notification already sent or failed" }`            |

---

#### 3.5 POST `/api/notifications/{id}/retry`

**Description:** Retry sending a failed notification.

| Aspect                     | Details                                                                                                  |
| -------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Request Body**           | None                                                                                                     |
| **Path Param**             | `id: uuid`                                                                                               |
| **Response 202 Accepted**  | `{ "id": "uuid", "status": "pending", "message": "Retry queued successfully", "updatedAt": "ISO-8601" }` |
| **Response 404 Not Found** | `{ "error": "NOT_FOUND", "message": "Notification not found" }`                                          |
| **Response 409 Conflict**  | `{ "error": "STATE_CONFLICT", "message": "Only failed notifications can be retried" }`                   |

---

## Global Error Responses

| Status Code | Error Code                          | Description                                    |
| ----------- | ----------------------------------- | ---------------------------------------------- |
| **400**     | `VALIDATION_ERROR`                  | Request payload validation failed              |
| **401**     | `UNAUTHORIZED`                      | Missing or invalid API key / authentication    |
| **403**     | `FORBIDDEN`                         | Insufficient permissions                       |
| **404**     | `NOT_FOUND`                         | Requested resource does not exist              |
| **409**     | `DUPLICATE_NAME` / `STATE_CONFLICT` | Resource conflict (duplicate or invalid state) |
| **422**     | `UNPROCESSABLE_ENTITY`              | Semantic validation failed                     |
| **429**     | `RATE_LIMITED`                      | Too many requests                              |
| **500**     | `INTERNAL_ERROR`                    | Unexpected server error                        |
| **503**     | `SERVICE_UNAVAILABLE`               | Service temporarily unavailable                |

## Common Response Headers

| Header                           | Description                           |
| -------------------------------- | ------------------------------------- |
| `Content-Type: application/json` | All responses                         |
| `X-Request-ID: uuid`             | Unique request identifier for tracing |
| `X-RateLimit-Limit: number`      | Rate limit ceiling                    |
| `X-RateLimit-Remaining: number`  | Remaining requests in window          |
| `X-RateLimit-Reset: timestamp`   | Rate limit reset time                 |

apikey--re_HCTBAEax_8RFkFQoEJuVWFmTSCagBpeDR
