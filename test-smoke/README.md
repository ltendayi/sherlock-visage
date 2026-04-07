# Hermes-Amara Smoke Test

A simple smoke test to verify the lead developer (DeepSeek-V3.2) functionality. This project consists of:

1. **C# .NET 8 Minimal API Backend** - Returns JSON with a greeting message and timestamp
2. **React TypeScript Frontend** - Fetches and displays the API data using Axios

## Project Structure

```
test-smoke/
├── backend/          # C# .NET 8 Minimal API
│   ├── Program.cs    # API endpoint: GET /api/hello
│   └── BackendApi.csproj
├── frontend/         # React TypeScript App
│   ├── src/
│   │   ├── App.tsx   # Main React component
│   │   └── App.css
│   └── package.json
└── README.md
```

## Quick Start

### 1. Start the Backend API

```bash
cd backend
dotnet run
```

The API will be available at:
- **Swagger UI:** http://localhost:5000/swagger
- **Hello Endpoint:** http://localhost:5000/api/hello

### 2. Start the React Frontend

```bash
cd frontend
npm start
```

The React app will open at: http://localhost:3000

## API Response

The `/api/hello` endpoint returns:

```json
{
  "message": "Hello World from .NET 8 Minimal API!",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "status": "Success",
  "environment": "Development"
}
```

## Features

- ✅ C# .NET 8 Minimal API with proper CORS configuration
- ✅ React TypeScript component with Axios integration
- ✅ Error handling and loading states
- ✅ Production-ready structure
- ✅ Responsive design with modern CSS

## Dependencies

### Backend (.NET 8)
- ASP.NET Core Web API
- Swagger/OpenAPI for documentation
- CORS enabled for React app

### Frontend (React)
- React 18 with TypeScript
- Axios for HTTP requests
- CSS animations and responsive design

## Verification

This smoke test verifies:
1. **Backend Functionality**: .NET 8 API creation and JSON serialization
2. **Frontend Integration**: React component with API data fetching
3. **Development Workflow**: Complete end-to-end setup
4. **Tool Compatibility**: All required tools (dotnet, node, npm) are working

## Troubleshooting

1. **CORS Errors**: Ensure both backend and frontend are running
2. **Certificate Errors**: Trust the development certificate or use HTTP instead of HTTPS
3. **Port Conflicts**: Change ports in `launchSettings.json` or `package.json` if needed