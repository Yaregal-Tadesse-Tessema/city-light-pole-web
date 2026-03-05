// @ts-nocheck
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Title,
  Badge,
  Text,
  Group,
  Button,
  Stack,
  Card,
  Grid,
  Image,
  Modal,
  Select,
  TextInput,
  Textarea,
  Checkbox,
  Alert,
  Tabs,
  Timeline,
  FileInput,
  ActionIcon,
  Tooltip,
  Divider,
  LoadingOverlay,
} from '@mantine/core';
import {
  IconEye,
  IconEdit,
  IconFileDownload,
  IconCheck,
  IconX,
  IconUpload,
  IconTrash,
  IconMapPin,
  IconCar,
  IconFileText,
  IconCamera,
  IconClock,
  IconUser,
  IconBuilding,
  IconSettings,
  IconArrowLeft,
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import axios from 'axios';
import jsPDF from 'jspdf';
import { useDisclosure } from '@mantine/hooks';
import { useAuth } from '../hooks/useAuth';
import EthiopianPhoneInput from '../components/EthiopianPhoneInput';
import VehiclePlateInput from '../components/VehiclePlateInput';
import { useTranslation } from 'react-i18next';
import {
  fromStoredPhoneToLocal,
  isValidEthiopianLocalPhone,
  toEthiopianInternationalPhone,
} from '../utils/ethiopianPhone';
import { ETHIOPIAN_INSURANCE_COMPANY_OPTIONS } from '../utils/ethiopianInsuranceCompanies';
import { toApiOriginUrl, toApiV1Url } from '../config/api';

function getAccidentStatusColor(status: string): string {
  switch (status?.toUpperCase()) {
    case 'REPORTED':
      return 'gray';
    case 'INSPECTED':
      return 'blue';
    case 'SUPERVISOR_REVIEW':
      return 'orange';
    case 'FINANCE_REVIEW':
      return 'yellow';
    case 'APPROVED':
      return 'green';
    case 'REJECTED':
      return 'red';
    case 'UNDER_REPAIR':
      return 'purple';
    case 'COMPLETED':
      return 'teal';
    default:
      return 'gray';
  }
}

function getClaimStatusColor(status: string): string {
  switch (status?.toUpperCase()) {
    case 'NOT_SUBMITTED':
      return 'gray';
    case 'SUBMITTED':
      return 'blue';
    case 'APPROVED':
      return 'green';
    case 'REJECTED':
      return 'red';
    case 'PAID':
      return 'teal';
    default:
      return 'gray';
  }
}

export default function AccidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { t } = useTranslation('accidentDetail');

  const damageLevels = [
    { value: 'MINOR', label: t('damageLevels.minor') },
    { value: 'MODERATE', label: t('damageLevels.moderate') },
    { value: 'SEVERE', label: t('damageLevels.severe') },
    { value: 'TOTAL_LOSS', label: t('damageLevels.totalLoss') },
  ];

  // Modal states
  const [damageAssessmentOpened, { open: openDamageAssessment, close: closeDamageAssessment }] = useDisclosure(false);
  const [approvalOpened, { open: openApproval, close: closeApproval }] = useDisclosure(false);
  const [photoUploadOpened, { open: openPhotoUpload, close: closePhotoUpload }] = useDisclosure(false);
  const [attachmentUploadOpened, { open: openAttachmentUpload, close: closeAttachmentUpload }] = useDisclosure(false);
  const [editOpened, { open: openEditModal, close: closeEdit }] = useDisclosure(false);

  // Custom openEdit function that populates form with current data
  const openEdit = () => {
    if (accident) {
      editForm.setValues({
        accidentType: accident.accidentType || '',
        accidentDate: accident.accidentDate ? new Date(accident.accidentDate).toISOString().split('T')[0] : '',
        accidentTime: accident.accidentTime || '',
        poleId: accident.poleId || '',
        latitude: accident.latitude || null,
        longitude: accident.longitude || null,
        locationDescription: accident.locationDescription || '',
        vehiclePlateNumber: accident.vehiclePlateNumber || '',
        driverName: accident.driverName || '',
        driverPhoneNumber: fromStoredPhoneToLocal(accident.driverPhoneNumber),
        driverLicenseNumber: accident.driverLicenseNumber || '',
        driverNationalIdNumber: accident.driverNationalIdNumber || '',
        insuranceCompany: accident.insuranceCompany || '',
        claimReferenceNumber: accident.claimReferenceNumber || '',
      });
    }
    openEditModal();
  };

  // Custom openDamageAssessment function that populates form with existing damage assessment data
  const openDamageAssessmentModal = () => {
    // Always include Labour Cost and Transport Cost components
    const alwaysIncludedComponents = damagedComponentsData?.filter(component =>
      component.name === 'Labour Cost' || component.name === 'Transport Cost'
    ).map(component => component.id) || [];

    if (accident) {
      const existingComponents = accident.damagedComponents?.map(dc => dc.damagedComponentId) || [];
      const combinedComponents = [...new Set([...existingComponents, ...alwaysIncludedComponents])];

      damageForm.setValues({
        damageLevel: accident.damageLevel || '',
        damageDescription: accident.damageDescription || '',
        safetyRisk: accident.safetyRisk || false,
        damagedComponents: combinedComponents,
      });
    } else {
      // For new assessments, still include the default components
      damageForm.setValues({
        damageLevel: '',
        damageDescription: '',
        safetyRisk: false,
        damagedComponents: alwaysIncludedComponents,
      });
    }
    openDamageAssessment();
  };

  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [selectedAttachments, setSelectedAttachments] = useState<File[]>([]);

  // Fetch accident details
  const { data: accident, isLoading, error, refetch } = useQuery({
    queryKey: ['accident', id],
    queryFn: () => {
      const token = localStorage.getItem('access_token');
      return axios.get(toApiV1Url(`/accidents/${id}`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then(res => res.data);
    },
    enabled: !!id,
  });

  // Damage assessment form
  const damageForm = useForm({
    initialValues: {
      damageLevel: '',
      damageDescription: '',
      safetyRisk: false,
      damagedComponents: [] as string[],
    },
  });

  // Approval form
  const approvalForm = useForm({
    initialValues: {
      action: '',
      comments: '',
    },
  });

  // Edit accident form
  const editForm = useForm({
    initialValues: {
      accidentType: '',
      accidentDate: '',
      accidentTime: '',
      poleId: '',
      latitude: null as number | null,
      longitude: null as number | null,
      locationDescription: '',
      vehiclePlateNumber: '',
      driverName: '',
      driverPhoneNumber: '',
      driverLicenseNumber: '',
      driverNationalIdNumber: '',
      insuranceCompany: '',
      claimReferenceNumber: '',
    },
    validate: {
      accidentType: (value) => !value && t('validation.accidentTypeRequired'),
      accidentDate: (value) => !value && t('validation.accidentDateRequired'),
      accidentTime: (value) => !value && t('validation.accidentTimeRequired'),
      locationDescription: (value) => !value && t('validation.locationDescriptionRequired'),
      driverPhoneNumber: (value) =>
        isValidEthiopianLocalPhone(value)
          ? null
          : t('validation.phoneFormat'),
      latitude: (value) => {
        if (value !== null && value !== undefined && value !== '') {
          const num = Number(value);
          if (isNaN(num)) return t('validation.latitudeValid');
          if (num < -90 || num > 90) return t('validation.latitudeRange');
        }
        return null;
      },
      longitude: (value) => {
        if (value !== null && value !== undefined && value !== '') {
          const num = Number(value);
          if (isNaN(num)) return t('validation.longitudeValid');
          if (num < -180 || num > 180) return t('validation.longitudeRange');
        }
        return null;
      },
    },
  });

  // Update accident mutation (damage assessment)
  const updateMutation = useMutation({
    mutationFn: (data: any) => {
      const token = localStorage.getItem('access_token');
      return axios.patch(toApiV1Url(`/accidents/${id}`), data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accident', id] });
      notifications.show({
        title: t('notifications.successTitle'),
        message: t('notifications.damageAssessmentSuccess'),
        color: 'green',
      });
      closeDamageAssessment();
      damageForm.reset();
    },
    onError: (error: any) => {
      notifications.show({
        title: t('notifications.errorTitle'),
        message: error.response?.data?.message || t('notifications.updateAccidentError'),
        color: 'red',
      });
    },
  });

  // Fetch poles for edit dropdown
  const { data: polesData } = useQuery({
    queryKey: ['poles', 'all'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(toApiV1Url('/poles?limit=10000'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
  });

  // Fetch damaged components for damage assessment
  const { data: damagedComponentsData } = useQuery({
    queryKey: ['damaged-components', 'active'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(toApiV1Url('/damaged-components?activeOnly=true'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
  });

  // Create a mapping of component IDs to names for display
  const componentNameMap = damagedComponentsData?.reduce((map: { [key: string]: string }, component: any) => {
    map[component.id] = component.name;
    return map;
  }, {}) || {};

  // Format poles for Select component
  const poleOptions = polesData?.items?.map((pole: any) => ({
    value: pole.code,
    label: `${pole.code} - ${pole.subcity}, ${pole.street}`,
  })) || [];

  // Edit accident mutation
  const editMutation = useMutation({
    mutationFn: (data: any) => {
      const token = localStorage.getItem('access_token');
      return axios.patch(toApiV1Url(`/accidents/${id}`), data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accident', id] });
      notifications.show({
        title: t('notifications.successTitle'),
        message: t('notifications.updateAccidentSuccess'),
        color: 'green',
      });
      closeEdit();
    },
    onError: (error: any) => {
      notifications.show({
        title: t('notifications.errorTitle'),
        message: error.response?.data?.message || t('notifications.updateAccidentError'),
        color: 'red',
      });
    },
  });

  // Approval mutation
  const approveMutation = useMutation({
    mutationFn: (data: any) => {
      const token = localStorage.getItem('access_token');
      return axios.post(toApiV1Url(`/accidents/${id}/approve`), data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accident', id] });
      notifications.show({
        title: t('notifications.successTitle'),
        message: t('notifications.approvalSuccess'),
        color: 'green',
      });
      closeApproval();
      approvalForm.reset();
    },
    onError: (error: any) => {
      notifications.show({
        title: t('notifications.errorTitle'),
        message: error.response?.data?.message || t('notifications.approvalError'),
        color: 'red',
      });
    },
  });

  // Claim status update mutation
  const claimUpdateMutation = useMutation({
    mutationFn: (claimStatus: string) => {
      const token = localStorage.getItem('access_token');
      return axios.patch(toApiV1Url(`/accidents/${id}/status`), { claimStatus }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accident', id] });
      notifications.show({
        title: t('notifications.successTitle'),
        message: t('notifications.claimStatusSuccess'),
        color: 'green',
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: t('notifications.errorTitle'),
        message: error.response?.data?.message || t('notifications.claimStatusError'),
        color: 'red',
      });
    },
  });

  // Photo upload mutation
  const photoUploadMutation = useMutation({
    mutationFn: (formData: FormData) => {
      const token = localStorage.getItem('access_token');
      return axios.post(toApiV1Url(`/accidents/${id}/photos`), formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accident', id] });
      notifications.show({
        title: t('notifications.successTitle'),
        message: t('notifications.photosUploadSuccess'),
        color: 'green',
      });
      closePhotoUpload();
      setSelectedPhotos([]);
    },
    onError: (error: any) => {
      notifications.show({
        title: t('notifications.errorTitle'),
        message: t('notifications.photosUploadError'),
        color: 'red',
      });
    },
  });

  // Delete photo mutation
  const deletePhotoMutation = useMutation({
    mutationFn: (photoId: string) => {
      const token = localStorage.getItem('access_token');
      return axios.delete(toApiV1Url(`/accidents/photos/${photoId}`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accident', id] });
      notifications.show({
        title: t('notifications.successTitle'),
        message: t('notifications.photoDeleteSuccess'),
        color: 'green',
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: t('notifications.errorTitle'),
        message: error.response?.data?.message || t('notifications.photoDeleteError'),
        color: 'red',
      });
    },
  });

  // Attachment upload mutation
  const attachmentUploadMutation = useMutation({
    mutationFn: (formData: FormData) => {
      const token = localStorage.getItem('access_token');
      return axios.post(toApiV1Url(`/accidents/${id}/attachments`), formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accident', id] });
      notifications.show({
        title: t('notifications.successTitle'),
        message: t('notifications.attachmentsUploadSuccess'),
        color: 'green',
      });
      closeAttachmentUpload();
      setSelectedAttachments([]);
    },
    onError: (error: any) => {
      notifications.show({
        title: t('notifications.errorTitle'),
        message: t('notifications.attachmentsUploadError'),
        color: 'red',
      });
    },
  });

  // Download report mutation
  const downloadReportMutation = useMutation({
    mutationFn: (type: string) => {
      const token = localStorage.getItem('access_token');
      return axios.get(toApiV1Url(`/accidents/${id}/reports/${type}`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob'
      });
    },
    onSuccess: (data, type) => {
      const url = window.URL.createObjectURL(new Blob([data.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    },
    onError: () => {
      notifications.show({
        title: t('notifications.errorTitle'),
        message: t('notifications.downloadReportError'),
        color: 'red',
      });
    },
  });

  const handleDamageAssessment = (values: any) => {
    console.log('🎯 Submitting damage assessment:', values);
    updateMutation.mutate({
      damageLevel: values.damageLevel,
      damageDescription: values.damageDescription,
      safetyRisk: values.safetyRisk,
      damagedComponents: values.damagedComponents,
    });
  };

  const handleApproval = (values: any) => {
    approveMutation.mutate(values);
  };

  const handleEdit = (values: any) => {
    console.log('🎯 Updating accident details:', values);

    // Clean up the data before sending
    const cleanedValues = {
      ...values,
      driverPhoneNumber: toEthiopianInternationalPhone(values.driverPhoneNumber),
      latitude: values.latitude === '' || values.latitude === null ? undefined : Number(values.latitude),
      longitude: values.longitude === '' || values.longitude === null ? undefined : Number(values.longitude),
    };

    editMutation.mutate(cleanedValues);
  };

  const handlePhotoUpload = () => {
    if (selectedPhotos.length === 0) return;

    const formData = new FormData();
    selectedPhotos.forEach(photo => {
      formData.append('files', photo);
    });

    photoUploadMutation.mutate(formData);
  };

  const handleAttachmentUpload = () => {
    if (selectedAttachments.length === 0) return;

    const formData = new FormData();
    selectedAttachments.forEach(attachment => {
      formData.append('files', attachment);
    });
    formData.append('attachmentType', 'OTHER');

    attachmentUploadMutation.mutate(formData);
  };

  const handleDeletePhoto = (photoId: string) => {
    if (window.confirm(t('confirm.deletePhoto'))) {
      deletePhotoMutation.mutate(photoId);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const downloadComprehensiveReport = async () => {
    if (!accident) {
      console.error('❌ No accident data available');
      notifications.show({
        title: t('notifications.errorTitle'),
        message: t('notifications.noAccidentForReport'),
        color: 'red',
      });
      return;
    }

    // Show loading notification
    const loadingNotification = notifications.show({
      title: t('notifications.generatingReport.title'),
      message: t('notifications.generatingReport.message'),
      color: 'blue',
      loading: true,
      autoClose: false,
    });

    try {
      // Create PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Add content
      doc.setFontSize(20);
      doc.text(t('pdf.comprehensiveReportTitle'), 20, 20);

      doc.setFontSize(12);
      doc.text(
        `${t('pdf.reportGenerated')}: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
        20,
        30,
      );
      doc.text(`${t('pdf.incidentId')}: ${accident.id}`, 20, 35);

      let yPosition = 50;

      // Section 1: Incident Information
      doc.setFontSize(16);
      doc.text(`1. ${t('pdf.sections.incidentInformation')}`, 20, yPosition);
      yPosition += 15;

      doc.setFontSize(10);
      // Debug: Log all accident properties
      console.log('PDF Generation - Accident object:', accident);

      doc.text(
        `${t('pdf.labels.status')}: ${accident.status?.replace(/_/g, ' ') || t('labels.notAvailable')}`,
        20,
        yPosition,
      );
      yPosition += 8;
      doc.text(
        `${t('pdf.labels.type')}: ${accident.type?.replace(/_/g, ' ') || accident.accidentType || t('labels.notAvailable')}`,
        20,
        yPosition,
      );
      yPosition += 8;
      doc.text(
        `${t('pdf.labels.reportedDate')}: ${
          accident.createdAt
            ? formatDate(accident.createdAt)
            : accident.accidentDate
            ? formatDate(accident.accidentDate)
            : t('labels.notAvailable')
        }`,
        20,
        yPosition,
      );
      yPosition += 8;
      doc.text(
        `${t('pdf.labels.incidentDate')}: ${accident.accidentDate ? formatDate(accident.accidentDate) : t('labels.notAvailable')}`,
        20,
        yPosition,
      );
      yPosition += 8;
      doc.text(
        `${t('pdf.labels.incidentTime')}: ${accident.accidentTime || t('labels.notAvailable')}`,
        20,
        yPosition,
      );
      yPosition += 8;
      doc.text(
        `${t('pdf.labels.location')}: ${
          typeof accident.latitude === 'number' ? accident.latitude.toFixed(6) : t('labels.notAvailable')
        }, ${
          typeof accident.longitude === 'number' ? accident.longitude.toFixed(6) : t('labels.notAvailable')
        }`,
        20,
        yPosition,
      );
      yPosition += 8;
      doc.text(
        `${t('pdf.labels.street')}: ${accident.street || accident.locationDescription || t('labels.notAvailable')}`,
        20,
        yPosition,
      );
      yPosition += 8;
      doc.text(
        `${t('pdf.labels.subcity')}: ${accident.subcity || t('labels.notAvailable')}`,
        20,
        yPosition,
      );
      yPosition += 8;
      doc.text(
        `${t('pdf.labels.poleId')}: ${accident.poleId || accident.pole?.code || t('labels.notAvailable')}`,
        20,
        yPosition,
      );
      yPosition += 8;
      doc.text(
        `${t('pdf.labels.vehiclePlate')}: ${accident.vehiclePlateNumber || t('labels.notAvailable')}`,
        20,
        yPosition,
      );
      yPosition += 8;
      doc.text(
        `${t('pdf.labels.driverName')}: ${accident.driverName || t('labels.notAvailable')}`,
        20,
        yPosition,
      );
      yPosition += 8;
      doc.text(
        `${t('pdf.labels.driverPhone')}: ${accident.driverPhoneNumber || t('labels.notAvailable')}`,
        20,
        yPosition,
      );
      yPosition += 8;
      doc.text(
        `${t('pdf.labels.driverLicense')}: ${accident.driverLicenseNumber || t('labels.notAvailable')}`,
        20,
        yPosition,
      );
      yPosition += 8;
      doc.text(
        `${t('pdf.labels.driverNationalId')}: ${accident.driverNationalIdNumber || t('labels.notAvailable')}`,
        20,
        yPosition,
      );
      yPosition += 8;
      doc.text(
        `${t('pdf.labels.insuranceCompany')}: ${accident.insuranceCompany || t('labels.notAvailable')}`,
        20,
        yPosition,
      );
      yPosition += 8;
      doc.text(
        `${t('pdf.labels.claimReference')}: ${accident.claimReferenceNumber || t('labels.notAvailable')}`,
        20,
        yPosition,
      );
      yPosition += 8;

      // Handle long descriptions
      const description = accident.description || accident.locationDescription || t('labels.notAvailable');
      if (description !== t('labels.notAvailable') && description.length > 80) {
        const lines = doc.splitTextToSize(`${t('pdf.labels.description')}: ${description}`, 150);
        doc.text(lines, 20, yPosition);
        yPosition += lines.length * 5 + 5;
      } else {
        doc.text(`${t('pdf.labels.description')}: ${description}`, 20, yPosition);
        yPosition += 8;
      }

      // Section 2: Damage Assessment
      if (accident.damageLevel || accident.damageDescription || accident.damagedComponents?.length) {
        doc.setFontSize(16);
        doc.text(`2. ${t('pdf.sections.damageAssessment')}`, 20, yPosition);
        yPosition += 15;

        doc.setFontSize(10);

        if (accident.damageLevel && typeof accident.damageLevel === 'string') {
          doc.text(`${t('pdf.labels.damageLevel')}: ${accident.damageLevel.replace(/_/g, ' ')}`, 20, yPosition);
          yPosition += 8;
        } else {
          doc.text(`${t('pdf.labels.damageLevel')}: ${t('labels.notAvailable')}`, 20, yPosition);
          yPosition += 8;
        }

        if (accident.damageDescription) {
          if (accident.damageDescription.length > 80) {
            const lines = doc.splitTextToSize(`${t('pdf.labels.description')}: ${accident.damageDescription}`, 150);
            doc.text(lines, 20, yPosition);
            yPosition += lines.length * 5 + 5;
          } else {
            doc.text(`${t('pdf.labels.description')}: ${accident.damageDescription}`, 20, yPosition);
            yPosition += 8;
          }
        }

        if (accident.safetyRisk !== undefined) {
          doc.text(
            `${t('pdf.labels.safetyRisk')}: ${accident.safetyRisk ? t('labels.highRisk') : t('labels.safe')}`,
            20,
            yPosition,
          );
          yPosition += 8;
        }

        if (accident.damagedComponents?.length) {
          const componentNames = accident.damagedComponents
            .map(dc => componentNameMap[dc.damagedComponentId] || dc.damagedComponentId || t('labels.unknownComponent'))
            .join(', ');
          if (componentNames.length > 80) {
            const lines = doc.splitTextToSize(`${t('pdf.labels.damagedComponents')}: ${componentNames}`, 150);
            doc.text(lines, 20, yPosition);
            yPosition += lines.length * 5 + 5;
          } else {
            doc.text(`${t('pdf.labels.damagedComponents')}: ${componentNames}`, 20, yPosition);
            yPosition += 8;
          }
        }
      }

      // Section 3: Cost Estimation
      if (accident.costBreakdown || accident.estimatedCost) {
        doc.setFontSize(16);
        doc.text(`3. ${t('pdf.sections.costEstimation')}`, 20, yPosition);
        yPosition += 15;

        doc.setFontSize(10);

        if (accident.estimatedCost) {
          doc.text(`${t('pdf.labels.estimatedTotalCost')}: ${formatCurrency(accident.estimatedCost)}`, 20, yPosition);
          yPosition += 10;
        }

        if (accident.costBreakdown) {
          // Add component costs (excluding labor and transport)
          const displayedComponents = accident.damagedComponents?.filter((damagedComponent) => {
            const componentName = componentNameMap[damagedComponent.damagedComponentId];
            return componentName !== 'Labour Cost' && componentName !== 'Transport Cost';
          }) || [];

          displayedComponents.forEach(component => {
            const componentName = componentNameMap[component.damagedComponentId] || component.damagedComponentId;
            doc.text(`${componentName}: ${formatCurrency(2000.00)}`, 20, yPosition);
            yPosition += 8;
          });

          if (accident.costBreakdown.labor) {
            doc.text(`${t('labels.laborCost')}: ${formatCurrency(accident.costBreakdown.labor)}`, 20, yPosition);
            yPosition += 8;
          }

          if (accident.costBreakdown.transport) {
            doc.text(`${t('labels.transportCost')}: ${formatCurrency(accident.costBreakdown.transport)}`, 20, yPosition);
            yPosition += 8;
          }

          // Calculate and display total
          const componentCost = displayedComponents.length * 2000.00;
          const laborCost = typeof accident.costBreakdown.labor === 'number' || typeof accident.costBreakdown.labor === 'string'
            ? (typeof accident.costBreakdown.labor === 'string' ? parseFloat(accident.costBreakdown.labor) : accident.costBreakdown.labor)
            : 0;
          const transportCost = typeof accident.costBreakdown.transport === 'number' || typeof accident.costBreakdown.transport === 'string'
            ? (typeof accident.costBreakdown.transport === 'string' ? parseFloat(accident.costBreakdown.transport) : accident.costBreakdown.transport)
            : 0;
          const totalCost = componentCost + laborCost + transportCost;

          yPosition += 5; // Add some space before total
          doc.setFontSize(12);
          doc.text(`${t('labels.totalLossCost')}: ${formatCurrency(totalCost)}`, 20, yPosition);
          yPosition += 15;
          doc.setFontSize(10);
        }
      }

      // Section 4: Evidence Summary
      if (accident.photos?.length || accident.attachments?.length) {
        doc.setFontSize(16);
        doc.text(`4. ${t('pdf.sections.evidenceSummary')}`, 20, yPosition);
        yPosition += 15;

        doc.setFontSize(10);

        if (accident.photos?.length) {
          doc.text(t('pdf.photosAvailable', { count: accident.photos.length }), 20, yPosition);
          yPosition += 10;

          // Add photo URLs (for reference)
          doc.setFontSize(8);
          accident.photos.forEach((photo: any, index: number) => {
            const photoUrl = photo.url || photo.path || t('pdf.photoLabel', { index: index + 1 });
            if (yPosition > 250) { // Check if we need a new page
              doc.addPage();
              yPosition = 20;
            }
            doc.text(`• ${photoUrl}`, 25, yPosition);
            yPosition += 6;
          });
          doc.setFontSize(10);
          yPosition += 5;
        }

        if (accident.attachments?.length) {
          doc.text(t('pdf.attachmentsAvailable', { count: accident.attachments.length }), 20, yPosition);
          yPosition += 8;
        }
      }

      // Section 5: Images (if available)
      if (accident.photos?.length) {
        // Check if we need a new page
        if (yPosition > 150) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(16);
        doc.text(`5. ${t('pdf.sections.accidentImages')}`, 20, yPosition);
        yPosition += 15;

        doc.setFontSize(10);
        doc.text(t('pdf.embeddedPhotos'), 20, yPosition);
        yPosition += 10;

        // Process images asynchronously
        const imagePromises = accident.photos.map(async (photo: any, index: number) => {
          try {
            console.log(`Processing photo ${index + 1}:`, photo);
            const imageUrl = photo.url || photo.path || photo.filename;
            if (!imageUrl) {
              console.log(`No URL found for photo ${index + 1}`);
              return null;
            }

            // Convert relative URL to full URL and try multiple known path shapes.
            let fullUrl: string;
            if (imageUrl.startsWith('http')) {
              fullUrl = imageUrl;
            } else {
              fullUrl = toApiOriginUrl(`/lightpoles/${imageUrl.replace(/^\//, '')}`);
            }

            console.log(`Loading image ${index + 1} from:`, fullUrl, 'original path:', imageUrl);

            // Try multiple URL formats if the first one fails
            const mediaCandidates = imageUrl.startsWith('http')
              ? [imageUrl]
              : [
                  fullUrl,
                  toApiOriginUrl(`/${imageUrl.replace(/^\//, '')}`),
                  toApiOriginUrl(`/uploads/accidents/${imageUrl.replace(/^\//, '')}`),
                ];

            let response: Response | undefined;
            let finalUrl = fullUrl;

            for (const candidate of mediaCandidates) {
              try {
                const res = await fetch(candidate);
                if (res.ok) {
                  response = res;
                  finalUrl = candidate;
                  break;
                }
              } catch {
                // Try next candidate URL.
              }
            }

            if (!response) {
              throw new Error(`Failed to load image from candidates: ${mediaCandidates.join(', ')}`);
            }

            if (!response.ok) {
              throw new Error(`Failed to load image: ${response.status} from ${finalUrl}`);
            }

            const blob = await response.blob();
            return new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = () => reject(new Error(t('errors.readImageFile')));
              reader.readAsDataURL(blob);
            });
          } catch (error) {
            console.error(`Failed to load image ${index + 1}:`, error);
            return null;
          }
        });

        // Wait for all images to load, then add them to PDF
        try {
          const imageDataArray = await Promise.all(imagePromises);

          imageDataArray.forEach((imageData, index) => {
            const photo = accident.photos[index];

            // Check if we need a new page
            if (yPosition > 180) {
              doc.addPage();
              yPosition = 20;
            }

            // Add image title
            doc.setFontSize(10);
            doc.text(t('pdf.imageLabel', { index: index + 1 }), 20, yPosition);
            yPosition += 8;

            if (imageData) {
              try {
                // Add the image (resize to fit)
                const imgWidth = 80; // mm
                const imgHeight = 60; // mm
                const imgX = 20;
                const imgY = yPosition;

                doc.addImage(imageData, 'JPEG', imgX, imgY, imgWidth, imgHeight);
                yPosition += imgHeight + 10; // Space after image

                console.log(`Successfully added image ${index + 1} to PDF`);
              } catch (imageError) {
                console.error(`Failed to add image ${index + 1} to PDF:`, imageError);
                doc.text(t('pdf.imageFailedToLoad'), 25, yPosition);
                yPosition += 8;
              }
            } else {
              // Image failed to load
              doc.text(t('pdf.imageFailedFromServer'), 25, yPosition);
              yPosition += 8;
            }

            // Add image description if available
            if (photo.description) {
              doc.text(`${t('pdf.description')}: ${photo.description}`, 25, yPosition);
              yPosition += 8;
            }

            // Add filename if available
            if (photo.filename || photo.name) {
              doc.setFontSize(8);
              doc.text(`${t('pdf.file')}: ${photo.filename || photo.name}`, 25, yPosition);
              yPosition += 6;
              doc.setFontSize(10);
            }

            yPosition += 10; // Extra space between images
          });
        } catch (error) {
          console.error('Error processing images:', error);
          doc.text(t('pdf.errorLoadingImages'), 20, yPosition);
          yPosition += 8;
        }
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(t('pdf.footer', { page: i, total: pageCount }), 20, 280);
      }

      // Save the PDF
      const fileName = `accident-report-${accident.id}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      // Close loading notification and show success
      notifications.update({
        id: loadingNotification,
        title: t('notifications.reportDownloaded.title'),
        message: t('notifications.reportDownloaded.message'),
        color: 'green',
        loading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error('❌ Error generating PDF report:', error);

      // Close loading notification and show error
      notifications.update({
        id: loadingNotification,
        title: t('notifications.errorTitle'),
        message: t('notifications.reportDownloadError'),
        color: 'red',
        loading: false,
        autoClose: 5000,
      });
    }
  };

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
    }).format(numAmount);
  };

  // Admin users can do all actions
  const isAdmin = user?.role === 'ADMIN';
  const canInspect = isAdmin || (user?.role === 'INSPECTOR' && accident?.status === 'REPORTED');
  const canApproveSupervisor = isAdmin || (user?.role === 'SUPERVISOR' && accident?.status === 'INSPECTED');
  const canApproveFinance = isAdmin || (user?.role === 'FINANCE' && accident?.status === 'SUPERVISOR_REVIEW');
  const canCompleteRepair = isAdmin || ((user?.role === 'SUPERVISOR' || user?.role === 'INSPECTOR') && accident?.status === 'UNDER_REPAIR');

  // Debug logging
  console.log('User:', user);
  console.log('Accident:', accident);
  console.log('canInspect:', canInspect, 'canApproveSupervisor:', canApproveSupervisor, 'canApproveFinance:', canApproveFinance);

  if (isLoading) {
    return (
      <Container size="xl" py="xl">
        <LoadingOverlay visible />
      </Container>
    );
  }

  if (error || !accident) {
    return (
      <Container size="xl" py="xl">
        <Alert color="red" title={t('error.title')}>
          {t('error.loadFailed')}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      {/* Header */}
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2}>{accident.incidentId}</Title>
          <Text c="dimmed">
            {t('header.reportedOn', {
              date: formatDate(accident.createdAt),
              name: accident.reportedBy?.fullName,
            })}
          </Text>
        </div>
        <Group>
          <Button
            variant="light"
            leftSection={<IconFileDownload size={16} />}
            onClick={() => downloadReportMutation.mutate('incident')}
            loading={downloadReportMutation.isPending}
          >
            {t('actions.downloadIncidentReport')}
          </Button>
          <Button
            variant="light"
            leftSection={<IconFileDownload size={16} />}
            onClick={() => downloadReportMutation.mutate('damage-assessment')}
            loading={downloadReportMutation.isPending}
          >
            {t('actions.downloadDamageAssessment')}
          </Button>
          <Button
            variant="light"
            leftSection={<IconFileDownload size={16} />}
            onClick={() => downloadReportMutation.mutate('cost-estimate')}
            loading={downloadReportMutation.isPending}
          >
            {t('actions.downloadCostEstimate')}
          </Button>
        </Group>
      </Group>

      {/* Status Badges */}
      <Group mb="lg">
        <Badge color={getAccidentStatusColor(accident.status)} size="lg">
          {accident.status.replace(/_/g, ' ')}
        </Badge>
        <Badge color={getClaimStatusColor(accident.claimStatus)} size="lg">
          {t('labels.claim')}: {accident.claimStatus.replace(/_/g, ' ')}
        </Badge>
        {accident.estimatedCost && (
          <Badge color="blue" size="lg">
            {t('labels.estimatedCost')}: {formatCurrency(accident.estimatedCost)}
          </Badge>
        )}
      </Group>

      {/* Back Button */}
      <Group mt="md" mb="md">
        <Button
          variant="light"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => navigate('/accidents')}
        >
          {t('actions.backToList')}
        </Button>
      </Group>

      <Tabs defaultValue="details">
        <Tabs.List>
          <Tabs.Tab value="details">{t('tabs.details')}</Tabs.Tab>
          <Tabs.Tab value="assessment">{t('tabs.assessment')}</Tabs.Tab>
          <Tabs.Tab value="photos">{t('tabs.photos')}</Tabs.Tab>
          <Tabs.Tab value="approvals">{t('tabs.approvals')}</Tabs.Tab>
          {(isAdmin || accident?.status === 'APPROVED' || accident?.status === 'UNDER_REPAIR' || accident?.status === 'COMPLETED') && (
            <Tabs.Tab value="claims">{t('tabs.claims')}</Tabs.Tab>
          )}
        </Tabs.List>

        {/* Incident Details Tab */}
        <Tabs.Panel value="details" pt="xl">
          <Grid>
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Card withBorder mb="md">
                <Card.Section withBorder inheritPadding py="sm">
                  <Title order={4}>{t('sections.incidentInformation')}</Title>
                </Card.Section>
                <Stack p="md" gap="md">
                  <Grid>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Text fw={500}>{t('fields.accidentType')}</Text>
                      <Text>{accident.accidentType.replace(/_/g, ' ')}</Text>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Text fw={500}>{t('fields.dateTime')}</Text>
                      <Text>{formatDate(accident.accidentDate)} {accident.accidentTime}</Text>
                    </Grid.Col>
                  </Grid>

                  <Divider />

                  <div>
                    <Text fw={500}>{t('fields.location')}</Text>
                    <Text>{accident.locationDescription}</Text>
                    {accident.latitude && accident.longitude && (
                      <Text size="sm" c="dimmed">
                        {t('fields.coordinates')}: {accident.latitude}, {accident.longitude}
                      </Text>
                    )}
                  </div>

                  <Divider />

                  <div>
                    <Text fw={500}>{t('fields.poleInformation')}</Text>
                    <Text>
                      {t('fields.poleId')}: {accident.poleId || t('labels.notSpecified')}
                    </Text>
                  </div>
                </Stack>
              </Card>

              <Card withBorder>
                <Card.Section withBorder inheritPadding py="sm">
                  <Title order={4}>
                    <IconCar size={16} style={{ marginRight: 8 }} />
                    {t('sections.vehicleInsurance')}
                  </Title>
                </Card.Section>
                <Stack p="md" gap="md">
                  <Grid>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Text fw={500}>{t('fields.vehiclePlateNumber')}</Text>
                      <Text>{accident.vehiclePlateNumber || t('labels.notProvided')}</Text>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Text fw={500}>{t('fields.driverName')}</Text>
                      <Text>{accident.driverName || t('labels.notProvided')}</Text>
                    </Grid.Col>
                  </Grid>

                  <Grid>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Text fw={500}>{t('fields.insuranceCompany')}</Text>
                      <Text>{accident.insuranceCompany || t('labels.notProvided')}</Text>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Text fw={500}>{t('fields.claimReference')}</Text>
                      <Text>{accident.claimReferenceNumber || t('labels.notProvided')}</Text>
                    </Grid.Col>
                  </Grid>
                </Stack>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              {/* Action Buttons */}
              <Card withBorder mb="md">
                <Card.Section withBorder inheritPadding py="sm">
                  <Title order={4}>{t('sections.actions')}</Title>
                </Card.Section>
                <Stack p="md" gap="sm">
                  {accident?.status === 'REPORTED' && (
                    <Button
                      fullWidth
                      leftSection={<IconEdit size={16} />}
                      onClick={openEdit}
                      variant="light"
                    >
                      {t('actions.editIncident')}
                    </Button>
                  )}

                  {canInspect && (
                    <Button
                      fullWidth
                      leftSection={<IconEdit size={16} />}
                      onClick={openDamageAssessmentModal}
                    >
                      {t('actions.performDamageAssessment')}
                    </Button>
                  )}

                  {(canApproveSupervisor || canApproveFinance) && accident?.status !== 'APPROVED' && (
                    <Button
                      fullWidth
                      leftSection={<IconCheck size={16} />}
                      color="green"
                      onClick={openApproval}
                    >
                      {t('actions.processApproval')}
                    </Button>
                  )}

                  <Button
                    fullWidth
                    variant="outline"
                    leftSection={<IconFileDownload size={16} />}
                    onClick={() => downloadComprehensiveReport()}
                  >
                    {t('actions.downloadFullReport')}
                  </Button>

                  {(canApproveSupervisor || canApproveFinance) && accident?.status === 'APPROVED' && (
                    <Button
                      fullWidth
                      leftSection={<IconCheck size={16} />}
                      color="green"
                      disabled
                    >
                      {t('actions.approvalCompleted')}
                    </Button>
                  )}

                  {canCompleteRepair && accident?.status !== 'APPROVED' && (
                    <Button
                      fullWidth
                      leftSection={<IconSettings size={16} />}
                      color="blue"
                      onClick={openApproval}
                    >
                      {t('actions.completeRepairs')}
                    </Button>
                  )}

                  {canCompleteRepair && accident?.status === 'APPROVED' && (
                    <Button
                      fullWidth
                      leftSection={<IconSettings size={16} />}
                      color="blue"
                      disabled
                    >
                      {t('actions.repairsCompleted')}
                    </Button>
                  )}

                  {accident?.status !== 'APPROVED' && (
                    <Button
                      fullWidth
                      variant="light"
                      leftSection={<IconCamera size={16} />}
                      onClick={openPhotoUpload}
                    >
                      {t('actions.addPhotos')}
                    </Button>
                  )}

                  {accident?.status !== 'APPROVED' && (
                    <Button
                      fullWidth
                      variant="light"
                      leftSection={<IconFileText size={16} />}
                      onClick={openAttachmentUpload}
                    >
                      {t('actions.addAttachments')}
                    </Button>
                  )}

                  {accident?.status === 'APPROVED' && (
                    <>
                      <Button
                        fullWidth
                        variant="light"
                        leftSection={<IconCamera size={16} />}
                        disabled
                      >
                        {t('actions.photosLocked')}
                      </Button>

                      <Button
                        fullWidth
                        variant="light"
                        leftSection={<IconFileText size={16} />}
                        disabled
                      >
                        {t('actions.attachmentsLocked')}
                      </Button>
                    </>
                  )}
                </Stack>
              </Card>

              {/* Quick Stats */}
              <Card withBorder>
                <Card.Section withBorder inheritPadding py="sm">
                  <Title order={4}>{t('sections.quickStats')}</Title>
                </Card.Section>
                <Stack p="md" gap="sm">
                  <div>
                    <Text size="sm" c="dimmed">{t('stats.photos')}</Text>
                    <Text fw={500}>{accident.photos?.length || 0}</Text>
                  </div>
                  <div>
                    <Text size="sm" c="dimmed">{t('stats.attachments')}</Text>
                    <Text fw={500}>{accident.attachments?.length || 0}</Text>
                  </div>
                  <div>
                    <Text size="sm" c="dimmed">{t('stats.approvalSteps')}</Text>
                    <Text fw={500}>{accident.approvals?.length || 0}</Text>
                  </div>
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        {/* Damage Assessment Tab */}
        <Tabs.Panel value="assessment" pt="xl">
          <Card withBorder>
            <Card.Section withBorder inheritPadding py="sm">
              <Title order={4}>{t('sections.damageAssessment')}</Title>
            </Card.Section>
            <Stack p="md" gap="md">
              {accident.damageLevel ? (
                <>
                  <Grid>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Text fw={500}>{t('fields.damageLevel')}</Text>
                      <Badge color="red">{accident.damageLevel}</Badge>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Text fw={500}>{t('fields.safetyRisk')}</Text>
                      <Badge color={accident.safetyRisk ? 'red' : 'green'}>
                        {accident.safetyRisk ? t('labels.yes') : t('labels.no')}
                      </Badge>
                    </Grid.Col>
                  </Grid>

                  <div>
                    <Text fw={500}>{t('fields.damageDescription')}</Text>
                    <Text>{accident.damageDescription}</Text>
                  </div>

                  {accident.estimatedCost && (
                    <div>
                      <Text fw={500}>{t('labels.estimatedCost')}</Text>
                      <Text size="lg" fw={600} c="green">{formatCurrency(accident.estimatedCost)}</Text>
                    </div>
                  )}

                  {accident.costBreakdown && (
                    <Card withBorder>
                      <Card.Section withBorder inheritPadding py="sm">
                        <Title order={5}>{t('sections.detailedCostBreakdown')}</Title>
                      </Card.Section>
                      <Stack p="md" gap="xs">
                        {/* Calculate displayed components count for total */}
                        {(() => {
                          const displayedComponents = accident.damagedComponents?.filter((damagedComponent) => {
                            const componentName = componentNameMap[damagedComponent.damagedComponentId];
                            return componentName !== 'Labour Cost' && componentName !== 'Transport Cost';
                          }) || [];

                          return (
                            <>
                              {/* Show costs for damaged components (excluding Labour and Transport) */}
                              {displayedComponents.map((damagedComponent, index) => {
                                const componentName = componentNameMap[damagedComponent.damagedComponentId];

                                return (
                                  <Group key={index} justify="space-between">
                                    <Text size="sm">{componentName || damagedComponent.damagedComponentId}:</Text>
                                    <Text size="sm" fw={500}>{formatCurrency(2000.00)}</Text>
                                  </Group>
                                );
                              })}

                              {/* Show labor and transport costs */}
                              {accident.costBreakdown?.labor && (
                                <Group justify="space-between">
                                  <Text size="sm">{t('labels.laborCost')}:</Text>
                                  <Text size="sm" fw={500}>{formatCurrency(accident.costBreakdown.labor)}</Text>
                                </Group>
                              )}

                              {accident.costBreakdown?.transport && (
                                <Group justify="space-between">
                                  <Text size="sm">{t('labels.transportCost')}:</Text>
                                  <Text size="sm" fw={500}>{formatCurrency(accident.costBreakdown.transport)}</Text>
                                </Group>
                              )}

                              {/* Show total loss cost */}
                              <Divider />
                              <Group justify="space-between">
                                <Text size="sm" fw={600}>{t('labels.totalLossCost')}:</Text>
                                <Text size="sm" fw={600}>
                                  {formatCurrency(
                                    (displayedComponents.length * 2000.00) +
                                    (accident.costBreakdown?.labor || 0) +
                                    (accident.costBreakdown?.transport || 0)
                                  )}
                                </Text>
                              </Group>
                            </>
                          );
                        })()}
                      </Stack>
                    </Card>
                  )}
                </>
              ) : (
                <>
                  {canInspect ? (
                    <Group justify="center">
                      <Button
                        leftSection={<IconEdit size={16} />}
                        onClick={openDamageAssessmentModal}
                      >
                        {t('actions.performDamageAssessment')}
                      </Button>
                    </Group>
                  ) : (
                    <Alert color="blue">
                      {isAdmin && ` ${t('guidance.admin')}`}
                      {!isAdmin && accident?.status === 'REPORTED' && !canInspect && ` ${t('guidance.reported')}`}
                      {!isAdmin && accident?.status === 'INSPECTED' && (canApproveSupervisor || canApproveFinance) && ` ${t('guidance.inspected')}`}
                      {!isAdmin && accident?.status === 'SUPERVISOR_REVIEW' && canApproveFinance && ` ${t('guidance.supervisorReview')}`}
                      {!isAdmin && accident?.status === 'APPROVED' && ` ${t('guidance.approved')}`}
                      {!isAdmin && accident?.status === 'UNDER_REPAIR' && canCompleteRepair && ` ${t('guidance.underRepair')}`}
                      {!isAdmin && accident?.status === 'COMPLETED' && ` ${t('guidance.completed')}`}
                      {!isAdmin && accident?.status === 'REJECTED' && ` ${t('guidance.rejected')}`}
                    </Alert>
                  )}
                </>
              )}
            </Stack>
          </Card>
        </Tabs.Panel>

        {/* Photos & Evidence Tab */}
        <Tabs.Panel value="photos" pt="xl">
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card withBorder mb="md">
                <Card.Section withBorder inheritPadding py="sm">
                  <Title order={4}>{t('sections.photos', { count: accident.photos?.length || 0 })}</Title>
                </Card.Section>
                <Stack p="md" gap="md">
                  {accident.photos?.length > 0 ? (
                    accident.photos.map((photo: any) => (
                      <Card
                        key={photo.id}
                        withBorder
                        style={{ position: 'relative', overflow: 'hidden' }}
                        onMouseEnter={() => {
                          const iconsDiv = document.querySelector(`[data-photo-id="${photo.id}"]`) as HTMLElement;
                          if (iconsDiv) iconsDiv.style.opacity = '1';
                        }}
                        onMouseLeave={() => {
                          const iconsDiv = document.querySelector(`[data-photo-id="${photo.id}"]`) as HTMLElement;
                          if (iconsDiv) iconsDiv.style.opacity = '0';
                        }}
                      >
                        <Card.Section style={{ position: 'relative' }}>
                          {photo.isVideo ? (
                            <video
                              src={photo.path}
                              controls
                              style={{ width: '100%', height: '250px', objectFit: 'cover' }}
                            />
                          ) : (
                            <Image
                              src={photo.path}
                              height={250}
                              alt={photo.description || t('labels.accidentPhoto')}
                              fit="cover"
                              style={{
                                transition: 'transform 0.2s ease',
                                cursor: 'pointer'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.02)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                              onClick={() => window.open(photo.path, '_blank')}
                            />
                          )}

                          {/* Action Icons */}
                          <div
                            data-photo-id={photo.id}
                            style={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              display: 'flex',
                              gap: '4px',
                              opacity: 0,
                              transition: 'opacity 0.3s ease',
                              pointerEvents: 'auto'
                            }}
                          >
                            <ActionIcon
                              variant="filled"
                              color="blue"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(photo.path, '_blank');
                              }}
                              style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
                            >
                              <IconEye size={14} />
                            </ActionIcon>
                            <ActionIcon
                              variant="filled"
                              color="red"
                              size="sm"
                              disabled={accident?.status === 'APPROVED'}
                              onClick={(e) => {
                                if (accident?.status === 'APPROVED') return;
                                e.stopPropagation();
                                handleDeletePhoto(photo.id);
                              }}
                              style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
                            >
                              <IconTrash size={14} />
                            </ActionIcon>
                          </div>

                          {/* Hover overlay for upload date */}
                          <div
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              background: 'rgba(0, 0, 0, 0.7)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: 0,
                              transition: 'opacity 0.3s ease',
                              pointerEvents: 'none'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.opacity = '1';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.opacity = '0';
                            }}
                          >
                            <Text size="sm" c="white" fw={500}>
                              {t('labels.uploaded')}: {formatDate(photo.createdAt)}
                            </Text>
                          </div>
                        </Card.Section>
                      </Card>
                    ))
                  ) : (
                    <Text c="dimmed">{t('empty.photos')}</Text>
                  )}
                </Stack>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card withBorder mb="md">
                <Card.Section withBorder inheritPadding py="sm">
                  <Title order={4}>{t('sections.attachments', { count: accident.attachments?.length || 0 })}</Title>
                </Card.Section>
                <Stack p="md" gap="md">
                  {accident.attachments?.length > 0 ? (
                    accident.attachments.map((attachment: any) => (
                      <Card key={attachment.id} withBorder>
                        <Group justify="space-between" p="sm">
                          <div>
                            <Text fw={500}>{attachment.originalName}</Text>
                            <Text size="sm" c="dimmed">
                              {t('labels.type')}: {attachment.attachmentType.replace(/_/g, ' ')}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {t('labels.uploaded')}: {formatDate(attachment.createdAt)}
                            </Text>
                          </div>
                          <Button
                            variant="light"
                            size="xs"
                            component="a"
                            href={`/uploads/accidents/${attachment.filename}`}
                            target="_blank"
                          >
                            {t('actions.view')}
                          </Button>
                        </Group>
                      </Card>
                    ))
                  ) : (
                    <Text c="dimmed">{t('empty.attachments')}</Text>
                  )}
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        {/* Approval History Tab */}
        <Tabs.Panel value="approvals" pt="xl">
          <Card withBorder>
            <Card.Section withBorder inheritPadding py="sm">
              <Title order={4}>{t('sections.approvalHistory')}</Title>
            </Card.Section>
            <Stack p="md" gap="md">
              {accident.approvals?.length > 0 ? (
                <Timeline>
                  {accident.approvals.map((approval: any) => (
                    <Timeline.Item
                      key={approval.id}
                      bullet={approval.action === 'APPROVE' ? <IconCheck size={12} /> : <IconX size={12} />}
                      title={`${approval.stage.replace(/_/g, ' ')} - ${approval.action}`}
                      lineVariant="dashed"
                    >
                      <Text size="sm" c="dimmed">
                        {t('labels.approvedBy', {
                          date: formatDate(approval.createdAt),
                          name: approval.approvedBy?.fullName,
                        })}
                      </Text>
                      {approval.comments && (
                        <Text size="sm" mt="xs">
                          {approval.comments}
                        </Text>
                      )}
                      <Text size="xs" c="dimmed" mt="xs">
                        {t('labels.statusChanged', {
                          from: approval.previousStatus.replace(/_/g, ' '),
                          to: approval.newStatus.replace(/_/g, ' '),
                        })}
                      </Text>
                    </Timeline.Item>
                  ))}
                </Timeline>
              ) : (
                <Text c="dimmed">{t('empty.approvals')}</Text>
              )}
            </Stack>
          </Card>
        </Tabs.Panel>

        {/* Claims Tab */}
        <Tabs.Panel value="claims" pt="xl">
          <Stack gap="md">
            {/* First: Insurance Claims */}
            <Card withBorder>
              <Card.Section withBorder inheritPadding py="sm">
                <Title order={4}>{t('sections.insuranceClaims')}</Title>
              </Card.Section>
              <Stack p="md" gap="md">
                <Group justify="space-between" align="center">
                  <div>
                    <Text fw={500}>{t('fields.claimStatus')}</Text>
                    <Badge
                      color={
                        accident.claimStatus === 'PAID' ? 'green' :
                        accident.claimStatus === 'APPROVED' ? 'blue' :
                        accident.claimStatus === 'SUBMITTED' ? 'yellow' :
                        accident.claimStatus === 'REJECTED' ? 'red' : 'gray'
                      }
                    >
                      {accident.claimStatus?.replace(/_/g, ' ') || t('labels.notSubmitted')}
                    </Badge>
                  </div>
                  {(isAdmin || user?.role === 'FINANCE') && (
                    <Select
                      placeholder={t('placeholders.updateClaimStatus')}
                      data={[
                        { value: 'NOT_SUBMITTED', label: t('claimStatus.notSubmitted') },
                        { value: 'SUBMITTED', label: t('claimStatus.submitted') },
                        { value: 'APPROVED', label: t('claimStatus.approved') },
                        { value: 'REJECTED', label: t('claimStatus.rejected') },
                        { value: 'PAID', label: t('claimStatus.paid') },
                      ]}
                      onChange={(value) => {
                        console.log('🎯 Claim status change selected:', value);
                        if (value) {
                          const payload = { claimStatus: value };
                          console.log('🎯 Sending payload:', payload);
                          console.log('🎯 Full API URL:', toApiV1Url(`/accidents/${id}/status`));
                          claimUpdateMutation.mutate(value);
                        }
                      }}
                      disabled={claimUpdateMutation.isPending}
                    />
                  )}
                </Group>

                {accident.insuranceCompany && (
                  <div>
                    <Text fw={500}>{t('fields.insuranceCompany')}</Text>
                    <Text>{accident.insuranceCompany}</Text>
                  </div>
                )}

                {accident.claimReferenceNumber && (
                  <div>
                    <Text fw={500}>{t('fields.claimReferenceNumber')}</Text>
                    <Text>{accident.claimReferenceNumber}</Text>
                  </div>
                )}
              </Stack>
            </Card>

            {/* Second: Cost Information */}
            <Card withBorder>
              <Card.Section withBorder inheritPadding py="sm">
                <Title order={4}>{t('sections.costInformation')}</Title>
              </Card.Section>
              <Stack p="md" gap="md">
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Text fw={500}>{t('labels.estimatedCost')}</Text>
                    <Text>
                      {accident.estimatedCost ? formatCurrency(accident.estimatedCost) : t('labels.notEstimatedYet')}
                    </Text>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Text fw={500}>{t('fields.safetyRisk')}</Text>
                    <Badge color={accident.safetyRisk ? 'red' : 'green'}>
                      {accident.safetyRisk ? t('labels.highRisk') : t('labels.safe')}
                    </Badge>
                  </Grid.Col>
                </Grid>

                {accident.damageLevel && (
                  <div>
                    <Text fw={500}>{t('fields.damageLevel')}</Text>
                    <Text>{accident.damageLevel.replace(/_/g, ' ')}</Text>
                  </div>
                )}

                {accident.damageDescription && (
                  <div>
                    <Text fw={500}>{t('fields.damageDescription')}</Text>
                    <Text>{accident.damageDescription}</Text>
                  </div>
                )}

                {accident.damagedComponents && accident.damagedComponents.length > 0 && (
                  <div>
                    <Text fw={500}>{t('fields.damagedComponents')}</Text>
                    <Group gap="xs">
                      {accident.damagedComponents.map((damagedComponent, index) => (
                        <Badge key={index} variant="light">
                          {componentNameMap[damagedComponent.damagedComponentId] || damagedComponent.damagedComponentId}
                        </Badge>
                      ))}
                    </Group>
                  </div>
                )}

                {/* Detailed Cost Breakdown */}
                {accident.costBreakdown && (
                  <div>
                    <Divider my="md" />
                    <Text fw={500} mb="md">{t('sections.detailedCostBreakdown')}</Text>
                    <Stack gap="xs">
                      {/* Calculate displayed components count for total */}
                      {(() => {
                        const displayedComponents = accident.damagedComponents?.filter((damagedComponent) => {
                          const componentName = componentNameMap[damagedComponent.damagedComponentId];
                          return componentName !== 'Labour Cost' && componentName !== 'Transport Cost';
                        }) || [];

                        return (
                          <>
                            {/* Show costs for damaged components (excluding Labour and Transport) */}
                            {displayedComponents.map((damagedComponent, index) => {
                              const componentName = componentNameMap[damagedComponent.damagedComponentId];

                              return (
                                <Group key={index} justify="space-between">
                                  <Text size="sm">{componentName || damagedComponent.damagedComponentId}:</Text>
                                  <Text size="sm" fw={500}>{formatCurrency(2000.00)}</Text>
                                </Group>
                              );
                            })}

                            {/* Show labor and transport costs */}
                            {accident.costBreakdown?.labor && (
                              <Group justify="space-between">
                                <Text size="sm">{t('labels.laborCost')}:</Text>
                                <Text size="sm" fw={500}>{formatCurrency(accident.costBreakdown.labor)}</Text>
                              </Group>
                            )}

                            {accident.costBreakdown?.transport && (
                              <Group justify="space-between">
                                <Text size="sm">{t('labels.transportCost')}:</Text>
                                <Text size="sm" fw={500}>{formatCurrency(accident.costBreakdown.transport)}</Text>
                              </Group>
                            )}

                            {/* Show total loss cost */}
                            <Divider />
                            <Group justify="space-between">
                              <Text size="sm" fw={600}>{t('labels.totalLossCost')}:</Text>
                              <Text size="sm" fw={600}>
                                {formatCurrency(
                                  (displayedComponents.length * 2000.00) +
                                  (accident.costBreakdown?.labor || 0) +
                                  (accident.costBreakdown?.transport || 0)
                                )}
                              </Text>
                            </Group>
                          </>
                        );
                      })()}
                    </Stack>
                  </div>
                )}
              </Stack>
            </Card>

            {/* Third: Incident Information */}
            <Card withBorder>
              <Card.Section withBorder inheritPadding py="sm">
                <Title order={4}>{t('sections.incidentInformation')}</Title>
              </Card.Section>
              <Stack p="md" gap="md">
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Text fw={500}>{t('fields.accidentType')}</Text>
                    <Text>{accident.accidentType.replace(/_/g, ' ')}</Text>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Text fw={500}>{t('fields.dateTime')}</Text>
                    <Text>{formatDate(accident.accidentDate)} {accident.accidentTime}</Text>
                  </Grid.Col>
                </Grid>

                <Divider />

                <div>
                  <Text fw={500}>{t('fields.location')}</Text>
                  <Text>{accident.locationDescription}</Text>
                  {accident.latitude && accident.longitude && (
                    <Text size="sm" c="dimmed">
                      {t('fields.coordinates')}: {accident.latitude}, {accident.longitude}
                    </Text>
                  )}
                </div>

                <Divider />

                <div>
                  <Text fw={500}>{t('fields.poleInformation')}</Text>
                  <Text>
                    {t('fields.poleId')}: {accident.poleId || t('labels.notSpecified')}
                  </Text>
                </div>
              </Stack>
            </Card>

            {/* Fourth: Vehicle & Insurance Information */}
            <Card withBorder>
              <Card.Section withBorder inheritPadding py="sm">
                <Title order={4}>
                  <IconCar size={16} style={{ marginRight: 8 }} />
                  {t('sections.vehicleInsurance')}
                </Title>
              </Card.Section>
              <Stack p="md" gap="md">
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Text fw={500}>{t('fields.vehiclePlateNumber')}</Text>
                    <Text>{accident.vehiclePlateNumber || t('labels.notProvided')}</Text>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Text fw={500}>{t('fields.driverName')}</Text>
                    <Text>{accident.driverName || t('labels.notProvided')}</Text>
                  </Grid.Col>
                </Grid>

                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Text fw={500}>{t('fields.insuranceCompany')}</Text>
                    <Text>{accident.insuranceCompany || t('labels.notProvided')}</Text>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Text fw={500}>{t('fields.claimReference')}</Text>
                    <Text>{accident.claimReferenceNumber || t('labels.notProvided')}</Text>
                  </Grid.Col>
                </Grid>

                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Text fw={500}>{t('fields.driverPhoneNumber')}</Text>
                    <Text>{accident.driverPhoneNumber || t('labels.notProvided')}</Text>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Text fw={500}>{t('fields.driverLicenseNumber')}</Text>
                    <Text>{accident.driverLicenseNumber || t('labels.notProvided')}</Text>
                  </Grid.Col>
                </Grid>

                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Text fw={500}>{t('fields.driverNationalIdNumber')}</Text>
                    <Text>{accident.driverNationalIdNumber || t('labels.notProvided')}</Text>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Text fw={500}>{t('fields.driverLicenseFile')}</Text>
                    <Text>{accident.driverLicenseFileName || accident.driverLicenseFileUrl || t('labels.notProvided')}</Text>
                  </Grid.Col>
                </Grid>
              </Stack>
            </Card>

            {/* Information Alert */}
            <Alert color="blue">
              <Text size="sm">
                {t('claimsInfo')}
              </Text>
            </Alert>
          </Stack>
        </Tabs.Panel>
      </Tabs>

      {/* Edit Accident Modal */}
      <Modal
        opened={editOpened}
        onClose={closeEdit}
        title={t('modals.edit.title')}
        size="lg"
      >
        <form onSubmit={editForm.onSubmit(handleEdit)}>
          <Stack gap="md">
            <Select
              label={t('fields.accidentType')}
              placeholder={t('placeholders.selectAccidentType')}
              data={[
                { value: 'VEHICLE_COLLISION', label: t('accidentTypes.vehicleCollision') },
                { value: 'NATURAL_DISASTER', label: t('accidentTypes.naturalDisaster') },
                { value: 'VANDALISM', label: t('accidentTypes.vandalism') },
                { value: 'TECHNICAL_FAILURE', label: t('accidentTypes.technicalFailure') },
                { value: 'OTHER', label: t('accidentTypes.other') },
              ]}
              required
              {...editForm.getInputProps('accidentType')}
            />

            <Group grow>
              <TextInput
                label={t('fields.accidentDate')}
                type="date"
                required
                {...editForm.getInputProps('accidentDate')}
              />
              <TextInput
                label={t('fields.accidentTime')}
                type="time"
                required
                {...editForm.getInputProps('accidentTime')}
              />
            </Group>

            <Select
              label={t('fields.poleId')}
              placeholder={t('placeholders.selectPoleOptional')}
              data={poleOptions}
              clearable
              {...editForm.getInputProps('poleId')}
            />

            <Textarea
              label={t('fields.locationDescription')}
              placeholder={t('placeholders.accidentLocation')}
              required
              minRows={3}
              {...editForm.getInputProps('locationDescription')}
            />

            <Group grow>
              <TextInput
                label={t('fields.latitude')}
                type="number"
                step="any"
                placeholder={t('placeholders.latitudeOptional')}
                min={-90}
                max={90}
                {...editForm.getInputProps('latitude')}
              />
              <TextInput
                label={t('fields.longitude')}
                type="number"
                step="any"
                placeholder={t('placeholders.longitudeOptional')}
                min={-180}
                max={180}
                {...editForm.getInputProps('longitude')}
              />
            </Group>

            <Divider />

            <Title order={4}>{t('sections.vehicleInsurance')}</Title>

            <Group grow>
              <VehiclePlateInput
                label={t('fields.vehiclePlateNumber')}
                value={editForm.values.vehiclePlateNumber}
                onChange={(value) => editForm.setFieldValue('vehiclePlateNumber', value)}
                error={editForm.errors.vehiclePlateNumber}
                placeholder={t('placeholders.vehiclePlate')}
              />
              <TextInput
                label={t('fields.driverName')}
                placeholder={t('placeholders.driverName')}
                {...editForm.getInputProps('driverName')}
              />
            </Group>

            <Group grow>
              <Select
                label={t('fields.insuranceCompany')}
                placeholder={t('placeholders.selectInsuranceCompany')}
                data={ETHIOPIAN_INSURANCE_COMPANY_OPTIONS}
                searchable
                clearable
                {...editForm.getInputProps('insuranceCompany')}
              />
              <TextInput
                label={t('fields.claimReferenceNumber')}
                placeholder={t('placeholders.claimReference')}
                {...editForm.getInputProps('claimReferenceNumber')}
              />
            </Group>

            <Group grow>
              <EthiopianPhoneInput
                label={t('fields.driverPhoneNumber')}
                value={editForm.values.driverPhoneNumber}
                onChange={(value) => editForm.setFieldValue('driverPhoneNumber', value)}
                error={editForm.errors.driverPhoneNumber}
              />
              <TextInput
                label={t('fields.driverLicenseNumber')}
                placeholder={t('placeholders.driverLicenseNumber')}
                {...editForm.getInputProps('driverLicenseNumber')}
              />
            </Group>

            <Group grow align="end">
              <TextInput
                label={t('fields.driverNationalIdNumber')}
                placeholder={t('placeholders.driverNationalIdNumber')}
                {...editForm.getInputProps('driverNationalIdNumber')}
              />
              <Button
                type="button"
                variant="light"
                onClick={() =>
                  notifications.show({
                    title: t('notifications.comingSoon.title'),
                    message: t('notifications.comingSoon.message'),
                    color: 'blue',
                  })
                }
              >
                {t('actions.verifyNationalId')}
              </Button>
            </Group>

            <Group justify="flex-end" mt="md">
              <Button variant="light" onClick={closeEdit}>
                {t('actions.cancel')}
              </Button>
              <Button type="submit" loading={editMutation.isPending}>
                {t('actions.updateAccident')}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Damage Assessment Modal */}
      <Modal
        opened={damageAssessmentOpened}
        onClose={closeDamageAssessment}
        title={accident?.status === 'APPROVED' ? t('modals.damageAssessment.viewOnlyTitle') : t('modals.damageAssessment.title')}
        size="lg"
      >
        <form onSubmit={damageForm.onSubmit(handleDamageAssessment)}>
          <Stack gap="md">
            {accident?.status === 'APPROVED' && (
              <Alert color="blue" variant="light">
                {t('modals.damageAssessment.viewOnlyNotice')}
              </Alert>
            )}

            <Select
              label={t('fields.damageLevel')}
              placeholder={t('placeholders.selectDamageLevel')}
              data={damageLevels}
              required
              disabled={accident?.status === 'APPROVED'}
              {...damageForm.getInputProps('damageLevel')}
            />

            <Textarea
              label={t('fields.damageDescription')}
              placeholder={t('placeholders.damageDescription')}
              required
              minRows={4}
              disabled={accident?.status === 'APPROVED'}
              {...damageForm.getInputProps('damageDescription')}
            />

            <Checkbox
              label={t('fields.safetyRiskQuestion')}
              disabled={accident?.status === 'APPROVED'}
              {...damageForm.getInputProps('safetyRisk', { type: 'checkbox' })}
            />

            <Text fw={500}>{t('fields.damagedComponents')}</Text>
            <Checkbox.Group {...damageForm.getInputProps('damagedComponents')}>
              <Group mt="xs">
                {damagedComponentsData?.map((component: any) => (
                  <Checkbox
                    key={component.id}
                    value={component.id}
                    label={component.name}
                    disabled={accident?.status === 'APPROVED'}
                  />
                ))}
              </Group>
            </Checkbox.Group>

            <Group justify="flex-end" mt="md">
              <Button variant="light" onClick={closeDamageAssessment}>
                {accident?.status === 'APPROVED' ? t('actions.close') : t('actions.cancel')}
              </Button>
              <Button
                type="submit"
                loading={updateMutation.isPending}
                disabled={accident?.status === 'APPROVED'}
              >
                {t('actions.completeAssessment')}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Approval Modal */}
      <Modal
        opened={approvalOpened}
        onClose={closeApproval}
        title={t('modals.approval.title')}
        size="md"
      >
        <form onSubmit={approvalForm.onSubmit(handleApproval)}>
          <Stack gap="md">
            <Select
              label={t('fields.action')}
              placeholder={t('placeholders.selectApprovalAction')}
              data={[
                { value: 'APPROVE', label: t('actions.approve') },
                { value: 'REJECT', label: t('actions.reject') },
              ]}
              required
              {...approvalForm.getInputProps('action')}
            />

            <Textarea
              label={t('fields.comments')}
              placeholder={t('placeholders.comments')}
              minRows={3}
              {...approvalForm.getInputProps('comments')}
            />

            <Group justify="flex-end" mt="md">
              <Button variant="light" onClick={closeApproval}>
                {t('actions.cancel')}
              </Button>
              <Button type="submit" loading={approveMutation.isPending}>
                {t('actions.submitApproval')}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Photo Upload Modal */}
      <Modal
        opened={photoUploadOpened}
        onClose={closePhotoUpload}
        title={t('modals.photoUpload.title')}
        size="md"
      >
        <Stack gap="md">
          <FileInput
            label={t('fields.selectPhotos')}
            placeholder={t('placeholders.choosePhotos')}
            multiple
            accept="image/*,video/*"
            onChange={(files) => setSelectedPhotos(files || [])}
          />

          {selectedPhotos.length > 0 && (
            <Text size="sm" c="dimmed">
              {t('labels.filesSelected', { count: selectedPhotos.length })}
            </Text>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={closePhotoUpload}>
              {t('actions.cancel')}
            </Button>
            <Button
              onClick={handlePhotoUpload}
              loading={photoUploadMutation.isPending}
              disabled={selectedPhotos.length === 0}
            >
              {t('actions.uploadPhotos')}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Attachment Upload Modal */}
      <Modal
        opened={attachmentUploadOpened}
        onClose={closeAttachmentUpload}
        title={t('modals.attachmentUpload.title')}
        size="md"
      >
        <Stack gap="md">
          <FileInput
            label={t('fields.selectFiles')}
            placeholder={t('placeholders.chooseDocuments')}
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={(files) => setSelectedAttachments(files || [])}
          />

          {selectedAttachments.length > 0 && (
            <Text size="sm" c="dimmed">
              {t('labels.filesSelected', { count: selectedAttachments.length })}
            </Text>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={closeAttachmentUpload}>
              {t('actions.cancel')}
            </Button>
            <Button
              onClick={handleAttachmentUpload}
              loading={attachmentUploadMutation.isPending}
              disabled={selectedAttachments.length === 0}
            >
              {t('actions.uploadAttachments')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
