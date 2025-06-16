export interface EmployeeList {
  position: number;
  emp_id: number;
  emp_code: string;
  emp_name: string;
  line_ids: number[];
  line_names: string[];
  branch_ids: number[];
  branch_names: string[];
  emp_status: number;
}