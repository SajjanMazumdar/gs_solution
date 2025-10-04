export interface AttendanceFilter  {
    search: string | null,
    state_id: number | null,
    district_id: number | null,
    line_id: number | null,
    status: number | null
}