import { createFileRoute } from '@tanstack/react-router'
import Header from '../components/headers/Header'
export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return (
    <div className="text-center">
        <Header />
    </div>
  )
}
