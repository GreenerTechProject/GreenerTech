import { createFileRoute } from '@tanstack/react-router'
import { BilansPage } from '../components/bilans'

export const Route = createFileRoute('/bilans')({
  component: BilansPage,
})
