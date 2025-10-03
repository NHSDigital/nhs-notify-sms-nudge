import { SupplierStatusEvent } from 'types';

export const fakeEvent: SupplierStatusEvent = {
  version: '0',
  id: '4c5b83de-d1ba-4082-bc7e-4a1636024b85',
  'detail-type': 'uk.nhs.notify.channels.nhsapp.SupplierStatusChange.v1',
  source: 'custom.event',
  account: '257995483745',
  time: '2025-07-30T09:57:58Z',
  region: 'eu-west-2',
  resources: [],
  detail: {
    id: 'bebcf961-23cb-44c7-9ec4-75fd9b3d22ec',
    source: '//nhs.notify.uk/supplier-status/internal-dev',
    specversion: '1.0',
    type: 'uk.nhs.notify.channels.nhsapp.SupplierStatusChange.v1',
    plane: 'data',
    subject: '30ad5WsumjRJR0YYL7U34UKne4U',
    time: '2025-07-30T09:57:57.027Z',
    datacontenttype: 'application/json',
    dataschema: 'https://notify.nhs.uk/events/schemas/supplier-status/v1.json',
    dataschemaversion: '1.0.0',
    data: {
      nhsNumber: '9999999786',
      delayedFallback: true,
      sendingGroupId: '66bad261-2754-4f4a-89bb-777502106cc6',
      clientId: 'apim_integration_test_client_id',
      supplierStatus: 'unnotified',
      previousSupplierStatus: 'received',
      requestItemId: '30ad4AdMGk8qHecaXGpc7oR94Xv',
      requestItemPlanId: '30ad5WsumjRJR0YYL7U34UKne4U',
    },
  },
};
