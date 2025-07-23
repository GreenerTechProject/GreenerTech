import { createFileRoute } from '@tanstack/react-router'
import TechnicienMapComponent from '../components/map/TechnicienMapComponent'

export const Route = createFileRoute('/tech-map-route')({
  //loadder her to fetxh some data befire
  component: TechnicienMapComponent,
})


