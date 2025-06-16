import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'objfilter',
  pure: false
})
export class ObjfilterPipe implements PipeTransform {

  // transform(array: any[], obj: any): any {
  //   if (!array || !obj) {
  //     return array;
  //   }
  //   let returnArray = array;
  //   for (let key of Object.keys(obj)) {
  //     returnArray = returnArray.filter(arr => arr[key] == obj[key]);
  //   }
  //   return returnArray;
  // }

  transform(array: any[], obj: any): any[] {
    if (!array) return [];
    if (!obj) return array;

    let returnArray = array;

    // for (let key of Object.keys(obj)) {
    //   returnArray = returnArray.filter(arr => arr[key] == obj[key]);
    // }

    // for (let key of Object.keys(obj)) {
    //   const filterValue = obj[key];
    //   if (Array.isArray(filterValue)) {
    //     returnArray = returnArray.filter(arr => filterValue.includes(arr[key]));
    //   } else {
    //     returnArray = returnArray.filter(arr => arr[key] == filterValue);
    //   }
    // }

    for (let key of Object.keys(obj)) {
      const filterValue = obj[key];

      returnArray = returnArray.filter(arr => {
        const arrVal = arr[key];

        const filterValues = Array.isArray(filterValue)
          ? filterValue.map(v => String(v))
          : typeof filterValue === 'string' && filterValue.includes(',')
            ? filterValue.split(',').map(v => v.trim())
            : [String(filterValue)];

        const arrValues = typeof arrVal === 'string' && arrVal.includes(',')
          ? arrVal.split(',').map(v => v.trim())
          : [String(arrVal)];

        return arrValues.some(val => filterValues.includes(val));
      });
    }

    return returnArray;
  }

}
