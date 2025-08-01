import { createFileRoute } from '@tanstack/react-router'
import Header from '../components/headers/Header'
import Connexion from '../components/connexion/Connexion'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return (
    <div className="text-center">
        <Connexion />
    </div>
  )
}
