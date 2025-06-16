import { Type } from '@angular/core';

export type MenuItem = {
  icon: string;
  label: string;
  route?: string;
  subItems?: MenuItem[];
  component?: Type<unknown>;
};

export const menuItems: MenuItem[] = [
  {
    icon: 'dashboard',
    label: 'Dashboard',
    route: 'dashboard',
  },
  {
    icon: 'people',
    label: 'Farmer',
    route: 'farmer',
    subItems: [
      {
        icon: 'contacts',
        label: 'Directory',
        route: 'farmer/list',
      },
      {
        icon: 'inventory',
        label: 'CFO Appr.',
        route: 'farmer/finance',
      },
      {
        icon: 'done_all',
        label: 'Admin Appr.',
        route: 'farmer/admin',
      }
    ]
  },
  {
    icon: 'widgets',
    label: 'Master',
    route: 'master',
    subItems: [
      {
        icon: 'category',
        label: 'Branch',
        route: 'master/branch',
        // subItems: [
        //   {
        //     icon: 'movie',
        //     label: 'Shorts',
        //     route: 'shorts',
        //     subItems: [
        //       {
        //         icon: 'play_circle',
        //         label: 'Videos',
        //         route: 'videos',
        //       },
        //     ],
        //   },
        //   {
        //     icon: 'tv',
        //     label: 'Long Form',
        //     route: 'long-form',
        //   },
        // ],
      },
      {
        icon: 'directions',
        label: 'Line',
        route: 'master/line',
      },
      {
        icon: 'pin_drop',
        label: 'Village',
        route: 'master/village',
      },
      {
        icon: 'person',
        label: 'Employee',
        route: 'master/employee',
      },
      {
        icon: 'account_balance',
        label: 'Bank',
        route: 'master/bank',
      }
    ],
  },

];
