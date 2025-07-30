import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/new-inscription-directeur')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/new-inscription-directeur"!</div>
}
