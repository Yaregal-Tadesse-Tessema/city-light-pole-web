const common = {
  loading: 'Loading...',
  noResults: 'No results found',
  actions: {
    close: 'Close',
    cancel: 'Cancel',
    save: 'Save',
  },
};

const layout = {
  systemName: 'Addis Ababa Light Poles Management System',
  languageSelectorLabel: 'Language',
  nav: {
    dashboard: 'Dashboard',
    lightPole: 'Light Pole',
    lightPoles: 'Light Poles',
    issues: 'Issues',
    maintenance: 'Maintenance',
    replacements: 'Replace Pole',
    components: 'Components',
    inventory: 'Inventory Management',
    inventoryItems: 'Inventory Items',
    categories: 'Categories',
    materialRequests: 'Material Requests',
    purchaseRequests: 'Purchase Requests',
    accidentManagement: 'Accident Management',
    accidents: 'Accidents',
    reports: 'Reports',
    damagedComponents: 'Components',
    users: 'Users',
  },
  actions: {
    logout: 'Logout',
  },
};

const landing = {
  hero: {
    preTitle: 'Addis Ababa',
    titleHighlight: 'Light Poles',
    titleSuffix: 'Management System',
    subtitle:
      'Advanced smart city infrastructure management with real-time monitoring, GPS tracking, and comprehensive maintenance scheduling for Addis Ababa\'s lighting network.',
    description:
      'Illuminate your city\'s infrastructure with intelligent management and cutting-edge technology',
    backButton: 'Back to Home',
  },
  cta: {
    login: 'Login to Continue',
    report: 'Report Accident',
    readyTitle: 'Ready to Get Started?',
    readyBody:
      'Join thousands of users already managing Addis Ababa\'s infrastructure with our advanced platform.',
    goToLogin: 'Go to Login',
  },
  sections: {
    powerfulFeaturesTitle: 'Powerful Features',
    powerfulFeaturesSubtitle:
      'Comprehensive infrastructure management tools designed specifically for Addis Ababa\'s smart city initiatives.',
    statsTitle: 'City Stats',
  },
  features: [
    {
      title: 'Smart Lighting',
      description:
        'Automated street light management with real-time monitoring and energy optimization.',
    },
    {
      title: 'GPS Tracking',
      description: 'Precise location tracking for all light poles with interactive mapping capabilities.',
    },
    {
      title: 'Analytics Dashboard',
      description: 'Comprehensive reporting and analytics for maintenance scheduling and performance monitoring.',
    },
    {
      title: 'Incident Management',
      description: 'Streamlined accident reporting and damage assessment workflow for quick response.',
    },
    {
      title: 'Surveillance Integration',
      description: 'Integrated camera systems for enhanced security and incident documentation.',
    },
    {
      title: 'Energy Management',
      description: 'Intelligent power management to reduce energy consumption and operational costs.',
    },
  ],
  stats: [
    { label: 'Light Poles Managed', valueLabel: 'lightPolesManaged' },
    { label: 'Subcities Covered', valueLabel: 'subcitiesCovered' },
    { label: 'Monitoring', valueLabel: 'monitoring' },
    { label: 'Uptime', valueLabel: 'uptime' },
    { label: 'Incidents Reported', valueLabel: 'incidentsReported' },
    { label: 'Issues Reported', valueLabel: 'issuesReported' },
    { label: 'In Progress Maintenances', valueLabel: 'inProgressMaintenances' },
    { label: 'Completed Maintenances', valueLabel: 'completedMaintenances' },
  ],
  statsValues: {
    lightPolesManaged: '5,000+',
    subcitiesCovered: '50+',
    monitoring: '24/7',
    uptime: '99.9%',
  },
};

const login = {
  title: 'Sign In to Your Account',
  fields: {
    email: 'Email Address',
    password: 'Password',
  },
  placeholders: {
    email: 'admin@city.gov',
    password: 'Enter your password',
  },
  buttons: {
    submit: 'Sign In Securely',
    submitting: 'Signing In...',
  },
  notifications: {
    successTitle: 'Success',
    successMessage: 'Logged in successfully',
    errorTitle: 'Error',
    defaultErrorMessage: 'Login failed',
  },
  footer: '© 2025 Smart City Infrastructure Management System',
};

const dashboard = {
  title: 'Dashboard',
  totals: {
    totalPoles: 'Total Poles',
    faultyPoles: 'Faulty Poles',
    maintenance: 'Maintenance in Progress',
    completedMaintenance: 'Completed Maintenances',
  },
  mapSection: {
    title: 'Addis Ababa Light Pole Distribution Map',
    helperText: 'Interactive geographical overview',
    detailText: 'Click on any subcity to view detailed pole information',
  },
  mapCard: {
    working: 'Working',
    faulty: 'Faulty',
    maintenance: 'Maintenance',
    totalLabel: 'Total',
    polesLabel: 'poles',
  },
  status: {
    working: 'Working',
    faulty: 'Faulty',
    maintenance: 'Maintenance',
  },
  tableHeaders: {
    subcity: 'Subcity',
    count: 'Count',
    street: 'Street',
  },
  tables: {
    operational: 'Operational Light Poles',
    maintenance: 'Light Poles Under Maintenance',
    failed: 'Failed Light Poles',
    tabs: {
      bySubcity: 'By Subcity',
      byStreet: 'By Street',
    },
    noData: {
      operational: 'No operational poles found',
      maintenance: 'No maintenance poles found',
      failed: 'No failed poles found',
    },
  },
};

const reportAccident = {
  backButton: 'Back to Home',
};

const en = {
  common,
  layout,
  landing,
  login,
  dashboard,
  reportAccident,
};

export default en;
