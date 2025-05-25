# Dynamic API Engine

A flexible and secure API engine that allows you to define custom validation logic for your endpoints at runtime.

## Features

-  Secure execution of custom validation functions in a sandboxed environment
-  Fast execution with timeout and memory limits
-  API key authentication
-  Health monitoring and execution statistics
-  Input validation and sanitization
-  Swagger documentation

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Olu-wafemi/dynamic-api-engine.git
cd dynamic-api-engine
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

### Development
```bash
npm run start:dev
```

### Production
```bash
npm run build
npm run start:prod
```

## API Documentation

Once the application is running, you can access the Swagger documentation at:

### Local Development
```
http://localhost:3000/api-docs
```

### Production
```
https://dynamic-api-engine.onrender.com/api-docs
```

## Usage

### 1. Generate an API Key

Generate an API key to access the endpoints:

#### Local Development
```bash
curl -X POST http://localhost:3000/config/api-key \
  -H "Content-Type: application/json" \
  -d '{"name": "my-api-key"}'
```

#### Production
```bash
curl -X POST https://dynamic-api-engine.onrender.com/config/api-key \
  -H "Content-Type: application/json" \
  -d '{"name": "my-api-key"}'
```

Save the returned API key securely - you'll need it for all subsequent requests.

### 2. Create an API Configuration

Define a new API endpoint with custom validation:

#### Local Development
```bash
curl -X POST http://localhost:3000/config \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "name": "email-validator",
    "method": "POST",
    "body": {
      "email": "",
      "name": ""
    },
    "customValidation": "function customValidation(data) {
      const { email, name } = data.body;
      
      if (!email) {
        return { isValid: false, message: 'Email is required' };
      }
      
      if (!name) {
        return { isValid: false, message: 'Name is required' };
      }
      
      const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
      if (!emailRegex.test(email)) {
        return { isValid: false, message: 'Invalid email format' };
      }
      
      return { isValid: true, message: 'Validation passed' };
    }"
  }'
```

#### Production
```bash
curl -X POST https://dynamic-api-engine.onrender.com/config \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "name": "email-validator",
    "method": "POST",
    "body": {
      "email": "",
      "name": ""
    },
    "customValidation": "function customValidation(data) {
      const { email, name } = data.body;
      
      if (!email) {
        return { isValid: false, message: 'Email is required' };
      }
      
      if (!name) {
        return { isValid: false, message: 'Name is required' };
      }
      
      const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
      if (!emailRegex.test(email)) {
        return { isValid: false, message: 'Invalid email format' };
      }
      
      return { isValid: true, message: 'Validation passed' };
    }"
  }'
```

### 3. Execute the API

Call your custom API endpoint:

#### Local Development
```bash
curl -X POST http://localhost:3000/api/email-validator \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "email": "test@example.com",
    "name": "John Doe"
  }'
```

#### Production
```bash
curl -X POST https://dynamic-api-engine.onrender.com/api/email-validator \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "email": "test@example.com",
    "name": "John Doe"
  }'
```

## Security Features

- Custom validation functions run in a secure sandbox
- Execution timeout (100ms)
- Memory limits (32MB)
- Restricted access to global objects
- API key authentication
- Input sanitization

## API Endpoints

### Configuration Management
- `POST /config/api-key` - Generate a new API key
- `POST /config` - Create a new API configuration
- `GET /config/:name` - Get a specific configuration
- `GET /config` - List all configurations
- `DELETE /config/:name` - Delete a configuration

### Dynamic API
- `POST /api/:name` - Execute a custom API endpoint

### Health & Monitoring
- `GET /health` - Check system health

## Development

### Running Tests
```bash
npm run test
```
