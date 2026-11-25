import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'

import { isContentEditor } from '../access/content'
import { hiddenFromTrainers } from '../access/roles'
import { altFromFilename } from '../lib/media-alt'
import { measureContentBoxHook } from '../lib/media/measure-hook'
import { logUploadDone, logUploadSaved, logUploadStart } from '../lib/media/upload-log'

/** Uploads without alt text (e.g. through the API) get it from the file name. */
const defaultAlt: CollectionBeforeValidateHook = ({ data }) => {
  if (data && !data.alt?.trim() && typeof data.filename === 'string') {
    data.alt = altFromFilename(data.filename)
  }
  return data
}

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    hidden: hiddenFromTrainers,
    defaultColumns: ['filename', 'alt', 'updatedAt', 'download'],
  },
  access: {
    read: () => true,
    create: isContentEditor,
    update: isContentEditor,
    delete: isContentEditor,
  },
  hooks: {
    beforeOperation: [logUploadStart],
    beforeValidate: [defaultAlt],
    beforeChange: [measureContentBoxHook],
    afterChange: [logUploadSaved],
    afterOperation: [logUploadDone],
  },
  fields: [
    {
      // Not stored: a Download link in the sidebar and a column in the list.
      name: 'download',
      type: 'ui',
      label: 'Download',
      admin: {
        position: 'sidebar',
        components: {
          Field: '/components/admin/MediaDownload#MediaDownloadField',
          Cell: '/components/admin/MediaDownload#MediaDownloadCell',
        },
      },
    },
    {
      name: 'alt',
      type: 'text',
      label: 'Alt text',
      required: true,
      admin: {
        description:
          'Filled in from the file name when you choose a file. Edit it to describe what the image or video shows.',
        components: { Field: '/components/admin/AltField#AltField' },
      },
    },
    {
      name: 'imageName',
      type: 'text',
      label: 'Image name',
      maxLength: 80,
      admin: {
        description: 'Optional. Shown under the thumbnail in a product gallery, e.g. "Emerald".',
      },
    },
    {
      // Set automatically on upload; used to frame product images. Fractions (0-1) of the image.
      name: 'contentBox',
      type: 'group',
      admin: { hidden: true },
      fields: [
        { name: 'left', type: 'number' },
        { name: 'top', type: 'number' },
        { name: 'width', type: 'number' },
        { name: 'height', type: 'number' },
      ],
    },
  ],
  upload: true,
}
