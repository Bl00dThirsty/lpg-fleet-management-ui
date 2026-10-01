import { createFileRoute } from '@tanstack/react-router'
import { infrastructureGroups, InfrastructureHeader, ProjectEnvironments } from '@/features/infrastructure'
import '@/styles/flag-icons/flags.css'

export const Route = createFileRoute('/_authenticated/infrastructure')({
  component: () => (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4">
        <InfrastructureHeader />

        <div className="flex flex-col gap-4">
          {infrastructureGroups.map((group) => (
            <ProjectEnvironments key={group.name} group={group} />
          ))}
        </div>
      </div>
    </div>
  ),
})
