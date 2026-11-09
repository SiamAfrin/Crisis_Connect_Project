import { ApprovedRequestCard } from "@/components/requests/approved-request-card";
import { AssignedRequestCard } from "@/components/requests/assigned-request-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import type { ResponderWorkspace } from "@/lib/requests/data";

type ResponderDashboardProps = {
  roleTitle: string;
  intro: string;
  categoryLabel?: string | null;
  subcategoryLabel?: string | null;
  workspace: ResponderWorkspace;
};

export function ResponderDashboard({
  roleTitle,
  intro,
  categoryLabel,
  subcategoryLabel,
  workspace,
}: ResponderDashboardProps) {
  const { approved, acceptances, assignments, victims, error } = workspace;

  const acceptanceByRequest = new Map(
    acceptances.map((acceptance) => [acceptance.request_id, acceptance] as const),
  );
  const assignmentByRequest = new Map(
    assignments.map(
      ({ assignment }) => [assignment.request_id, assignment] as const,
    ),
  );
  const victimById = new Map(
    victims.map((victim) => [victim.id, victim] as const),
  );

  const categoryText = [categoryLabel, subcategoryLabel]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-8">
      <PageHeader
        title={roleTitle}
        description={intro}
        meta={
          categoryText ? (
            <p className="text-xs text-ink-500">{categoryText}</p>
          ) : undefined
        }
      />

      {error ? (
        <Notice tone="warning">
          We could not load your responder workspace right now. Refresh the page
          to try again.
        </Notice>
      ) : null}

      <section className="space-y-4" aria-label="Approved emergency requests">
        <div>
          <h2 className="text-lg font-semibold text-ink-950">
            Approved requests
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            Accept the requests your team can handle.
          </p>
        </div>

        {!error && approved.length === 0 ? (
          <EmptyState
            title="No approved requests available"
            description="Approved emergency requests will appear here when an administrator reviews a new request."
          />
        ) : null}

        {approved.length > 0 ? (
          <div className="space-y-3">
            {approved.map((request) => {
              const acceptance = acceptanceByRequest.get(request.request_id);

              return (
                <ApprovedRequestCard
                  key={request.request_id}
                  request={request}
                  acceptedAt={acceptance?.accepted_at ?? null}
                  assignmentStatus={
                    assignmentByRequest.get(request.request_id)
                      ?.assignment_status ?? null
                  }
                  victim={
                    acceptance
                      ? (victimById.get(request.victim_id) ?? null)
                      : null
                  }
                />
              );
            })}
          </div>
        ) : null}
      </section>

      <section className="space-y-4" aria-label="My assignments">
        <div>
          <h2 className="text-lg font-semibold text-ink-950">Your assignments</h2>
          <p className="mt-1 text-sm text-ink-500">
            Requests an administrator has assigned to you.
          </p>
        </div>

        {!error && assignments.length === 0 ? (
          <EmptyState
            title="No assignments yet"
            description="Accept an approved request to become eligible. An administrator will then assign a responder to the response."
          />
        ) : null}

        {assignments.length > 0 ? (
          <div className="space-y-3">
            {assignments.map(({ assignment, request }) => (
              <AssignedRequestCard
                key={assignment.assignment_id}
                assignment={assignment}
                request={request}
                victim={
                  request
                    ? (victimById.get(request.victim_id) ?? null)
                    : null
                }
              />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
