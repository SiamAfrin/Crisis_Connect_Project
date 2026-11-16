import Link from "next/link";

import {
  ClockIcon,
  MapPinIcon,
  UserIcon,
} from "@/components/ui/icons";
import { MISSING_PERSON_GENDER_LABELS } from "@/lib/constants";
import type { MissingPersonRecord } from "@/lib/missing-persons/data";
import { formatDateTime } from "@/lib/requests/format";

import { MissingPersonPhoto } from "./missing-person-photo";
import { MissingPersonStatusBadge } from "./missing-person-status-badge";

type MissingPersonCardProps = {
  report: MissingPersonRecord;
};

export function MissingPersonCard({ report }: MissingPersonCardProps) {
  return (
    <Link
      href={`/missing-persons/${report.report_id}`}
      className="group block rounded-lg border border-line bg-white p-5 transition hover:border-ink-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-950"
    >
      <div className="flex gap-4">
        <MissingPersonPhoto
          src={report.photoUrl}
          alt={report.full_name}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-ink-500">
                Reported {formatDateTime(report.created_at)}
              </p>
              <h2 className="mt-1 text-base font-semibold text-ink-950 transition group-hover:text-signal-700">
                {report.full_name}
              </h2>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-500">
                <UserIcon
                  aria-hidden="true"
                  className="size-3.5 text-ink-400"
                />
                {report.age !== null
                  ? `${report.age} years old · ${MISSING_PERSON_GENDER_LABELS[report.gender]}`
                  : MISSING_PERSON_GENDER_LABELS[report.gender]}
              </p>
            </div>
            <MissingPersonStatusBadge status={report.status} />
          </div>

          <p className="mt-3 line-clamp-2 text-sm leading-6 text-ink-600">
            {report.description}
          </p>
        </div>
      </div>

      <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-line-soft pt-3 text-xs text-ink-500">
        <div className="flex items-center gap-1.5">
          <MapPinIcon aria-hidden="true" className="size-3.5 text-ink-400" />
          <dt className="sr-only">Last seen location</dt>
          <dd className="max-w-72 truncate">
            {report.last_seen_location}
          </dd>
        </div>
        <div className="flex items-center gap-1.5">
          <ClockIcon aria-hidden="true" className="size-3.5 text-ink-400" />
          <dt className="sr-only">Last seen at</dt>
          <dd>{formatDateTime(report.last_seen_at)}</dd>
        </div>
      </dl>
    </Link>
  );
}
