# Sherlock Visage Dashboard

A React + Vite + TypeScript + Ant Design glass cockpit visualization for Nairobi HQ operations monitoring AI delegate systems.

## Features

### 1. Nairobi Floor Plan Visualization
- Interactive floor plan with 7 glowing nodes representing AI delegates
- Color-coded zones for different operational areas
- Real-time status indicators with glow intensity based on activity
- Node details on hover with performance metrics

### 2. Cost Monitoring Dashboard
- Budget gauge showing $280-570 monthly range
- Current spend vs projected spend visualization
- Daily average and cost per token statistics
- Budget efficiency tracking with alerts

### 3. Token Efficiency Analysis
- Delta vs Full File token usage comparison
- Efficiency ratio calculations and trends
- Time-based filtering (day/week/month)
- Optimization recommendations

### 4. System Health Monitoring
- Overall health dial with 80% target indicator
- Component-level health tracking (API, Database, Network, Queue)
- Real-time status updates
- Alert system for below-target performance

### 5. Task Tracking Board
- Trello-style drag-and-drop task management
- Priority-based color coding
- Token cost tracking per task
- Assignee and deadline management

### 6. AI Delegate Grid
- Detailed status cards for all 7 delegates
- Real-time CPU, Memory, and Token usage
- Uptime tracking and quick actions
- Performance metrics visualization

### 7. Real-time Updates
- WebSocket integration for live data
- Mock data simulation for demonstration
- Automatic periodic updates
- Event-driven state management

## Technology Stack

- **React 18** - UI library
- **Vite** - Build tool and development server
- **TypeScript** - Type safety
- **Ant Design 5** - UI component library
- **Recharts** - Data visualization
- **Framer Motion** - Animations
- **Socket.IO Client** - WebSocket communication
- **date-fns** - Date utilities

## Project Structure

```
src/
├── components/
│   ├── Header.tsx                 # Dashboard header
│   ├── Sidebar.tsx                # Navigation sidebar
│   ├── visualization/
│   │   └── NairobiFloorPlan.tsx   # Floor plan visualization
│   ├── metrics/
│   │   ├── CostGauge.tsx          # Cost monitoring
│   │   ├── TokenEfficiencyChart.tsx
│   │   └── SystemHealthDial.tsx   # Health monitoring
│   ├── tasks/
│   │   └── TaskBoard.tsx          # Trello-style task board
│   └── delegates/
│       └── DelegateGrid.tsx       # AI delegate status grid
├── hooks/
│   └── useDashboardData.ts       # Data management hook
├── services/
│   └── WebSocketClient.ts        # WebSocket service
├── types/
│   └── index.ts                  # TypeScript definitions
├── styles/
│   └── index.css                 # Global styles
└── assets/                       # Static assets
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sherlock-visage
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

4. Open browser at `http://localhost:3000`

## WebSocket Integration

The dashboard includes a WebSocket client for real-time updates:

- Singleton pattern WebSocket service
- Automatic reconnection with exponential backoff
- Message type-specific subscriptions
- Mock data simulation when backend not available

To enable real WebSocket connection, set:
```env
VITE_WS_URL=ws://your-backend-url:port
```

## Mock Data

The application includes comprehensive mock data for:
- 7 AI delegates with varying statuses
- Cost metrics within $280-570 budget range
- Token efficiency historical data
- System health metrics
- Sample tasks for task board

Mock data updates automatically every 10 seconds to simulate real-time changes.

## Customization

### Styling
- Glass effect CSS variables in `src/styles/index.css`
- Ant Design theme customization in `App.tsx`
- Responsive grid layouts

### Data Sources
- Replace mock data with real API calls
- Configure WebSocket endpoint
- Adjust update intervals

### Features
- Enable/disable features via environment variables
- Add new delegate types
- Customize floor plan layout

## Performance

- Virtualized lists for large datasets
- Memoized components to prevent unnecessary re-renders
- Efficient WebSocket message handling
- Optimized animations with Framer Motion

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Code Standards
- TypeScript strict mode enabled
- ESLint with React/TypeScript rules
- Consistent component structure
- Comprehensive TypeScript interfaces

## Deployment

1. Build the application:
```bash
npm run build
```

2. The `dist` folder contains static files ready for deployment.

3. Configure environment variables for production.

## License

MIT License - see LICENSE file for details.