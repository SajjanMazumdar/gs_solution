import { Pipe, PipeTransform } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';

@Pipe({
  name: 'matfilter'
})
export class MatfilterPipe implements PipeTransform {

  transform(items: any[] | MatTableDataSource<any>, criteria: any): any[] {
    if (!items || !criteria) return items instanceof MatTableDataSource ? items.data : items;

    const data = items instanceof MatTableDataSource ? items.data : items;

    return data.filter(item =>
      Object.keys(criteria).every(key => item[key] == criteria[key])
    );
  }

}
