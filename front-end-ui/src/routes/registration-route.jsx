import { createFileRoute } from '@tanstack/react-router'
import SignUpWizard from '../components/Inscription/StepUpWizard'

export const Route = createFileRoute('/registration-route')({
  component: SignUpWizard
})


