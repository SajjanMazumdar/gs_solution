
export type MenuItem = {
  unique_id: number;
  icon: string;
  label: string;
  route: string;
  status: boolean;
  subItems?: MenuItem[];
};

export const menuItems: MenuItem[] = [
  {
    unique_id: 1,
    icon: 'dashboard',
    label: 'Dashboard',
    route: 'dashboard',
    status: true,
  },
  {
    unique_id: 4,
    icon: 'master',
    label: 'Master',
    route: '',
    status: true,
    subItems: [
      {
        unique_id: 5,
        icon: 'classification-icon',
        label: 'Branch',
        route: '/master/branch',
        status: true,
      },
      {
        unique_id: 6,
        icon: 'site',
        label: 'Site',
        route: '/master/site',
        status: true,
      },
      {
        unique_id: 7,
        icon: 'land-location-icon',
        label: 'Rank',
        route: '/master/rank',
        status: true,
      },
      {
        unique_id: 8,
        icon: 'guard-man',
        label: 'Guard',
        route: '/master/guard',
        status: true,
      },
      {
        unique_id: 8,
        icon: 'badge-pass-icon',
        label: 'Employee',
        route: '/master/employee',
        status: true,
      },
      {
        unique_id: 9,
        icon: 'bank-building-icon',
        label: 'Bank',
        route: '/master/bank',
        status: true,
      }
    ],
  },

];

export function setMenuStatusFromUser(menuItems: MenuItem[], userMenuItems: any[]): MenuItem[] {
  return menuItems.map(item => {
    // Find the matching user menu item by unique_id
    const userItem = userMenuItems.find(u => u.unique_id === item.unique_id);

    // If found, set status true, else false
    const status = !!userItem;

    // If both have subItems, recurse
    let subItems;
    if (item.subItems && userItem && userItem.subItems) {
      subItems = setMenuStatusFromUser(item.subItems, userItem.subItems);
    } else if (item.subItems) {
      // If static has subItems but user does not, set all to false
      subItems = item.subItems.map(sub => ({ ...sub, status: false }));
    }

    return {
      ...item,
      status,
      subItems
    };
  });
}
