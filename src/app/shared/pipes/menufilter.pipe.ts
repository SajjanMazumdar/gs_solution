import { Pipe, PipeTransform } from '@angular/core';
import { MenuItem } from '../../menu-items';

@Pipe({
  name: 'menufilter',
  pure: false,
})
export class MenufilterPipe implements PipeTransform {

  transform(items: MenuItem[] | undefined | null): MenuItem[] {
    // Handle undefined or null input
    if (!items) {
      return [];
    }

    // Filter out items with status === false and recursively filter their subItems
    return items
      .filter(item => item.status !== false)
      .map(item => {
        // Clone the item to avoid modifying the original
        const filteredItem = {...item};
        
        // Recursively filter subItems if they exist
        if (filteredItem.subItems) {
          filteredItem.subItems = this.transform(filteredItem.subItems);
        }
        
        return filteredItem;
      });
  }

}
