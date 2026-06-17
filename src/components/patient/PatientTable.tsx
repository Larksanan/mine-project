/* eslint-disable no-undef */
import { FiUser, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { Patient } from '@/types/patient';
import PatientTableRow from './PatientTableRow';
import { motion, AnimatePresence, Variants } from 'framer-motion';
interface PatientTableProps {
  patients: Patient[];
  deletingId: string | null;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAddPatient?: () => void;
  sortBy: string;
  sortOrder: string;
  onSortChange: (field: string) => void;
}

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.3 },
  },
};

const tableHeaderVariants: Variants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 12,
    },
  },
};

const emptyStateVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 12,
      delay: 0.2,
    },
  },
};

const SortIcon = ({
  field,
  sortBy,
  sortOrder,
}: {
  field: string;
  sortBy: string;
  sortOrder: string;
}) => {
  if (sortBy !== field) {
    return (
      <motion.span
        className='ml-1 inline-flex'
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        whileHover={{ scale: 1.2 }}
      >
        <FiArrowUp className='w-3 h-3 text-gray-400 rotate-180' />
        <FiArrowDown className='w-3 h-3 text-gray-400 -ml-1' />
      </motion.span>
    );
  }

  return (
    <motion.span
      className='ml-1 inline-flex'
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      {sortOrder === 'asc' ? (
        <FiArrowUp className='w-4 h-4 text-blue-600' />
      ) : (
        <FiArrowDown className='w-4 h-4 text-blue-600' />
      )}
    </motion.span>
  );
};

const PatientTable: React.FC<PatientTableProps> = ({
  patients,
  deletingId,
  onView,
  onEdit,
  onDelete,
  onAddPatient,
  sortBy,
  sortOrder,
  onSortChange,
}) => {
  if (patients.length === 0) {
    return (
      <motion.div
        variants={emptyStateVariants}
        initial='hidden'
        animate='visible'
        exit='exit'
        className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden'
      >
        <div className='text-center py-16 px-4'>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 20,
              delay: 0.3,
            }}
            className='w-24 h-24 mx-auto mb-6 rounded-full bg-linear-to-br from-blue-100 to-indigo-100 flex items-center justify-center'
          >
            <FiUser className='h-12 w-12 text-blue-600' />
          </motion.div>

          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className='text-2xl font-bold text-gray-900 mb-2'
          >
            No patients found
          </motion.h3>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className='text-gray-500 mb-8 max-w-md mx-auto'
          >
            No patients in your records yet. Start by adding your first patient
            to begin managing their healthcare.
          </motion.p>

          {onAddPatient && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onAddPatient}
              className='inline-flex items-center px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg'
            >
              <FiUser className='w-5 h-5 mr-2' />
              Add Your First Patient
            </motion.button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial='hidden'
      animate='visible'
      exit='exit'
      className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden'
    >
      <div className='overflow-x-auto'>
        <motion.table className='w-full' variants={containerVariants}>
          <motion.thead
            className='bg-linear-to-r from-gray-50 to-gray-100/80'
            variants={tableHeaderVariants}
          >
            <tr>
              {[
                { field: 'name', label: 'Patient' },
                { field: null, label: 'Contact' },
                { field: 'age', label: 'Age & Gender' },
                { field: null, label: 'Medical Info' },
                { field: 'joinDate', label: 'Joined' },
                { field: null, label: 'Actions', align: 'right' },
              ].map((column, index) => (
                <motion.th
                  key={index}
                  onClick={() => column.field && onSortChange(column.field)}
                  className={`
                    px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider
                    ${column.field ? 'cursor-pointer hover:bg-gray-200/50' : ''}
                    ${column.align === 'right' ? 'text-right' : ''}
                  `}
                  whileHover={
                    column.field
                      ? { backgroundColor: 'rgba(156, 163, 175, 0.1)' }
                      : {}
                  }
                  transition={{ duration: 0.2 }}
                >
                  <motion.div
                    className='flex items-center'
                    layout={column.field ? true : false}
                  >
                    {column.label}
                    {column.field && (
                      <SortIcon
                        field={column.field}
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                      />
                    )}
                  </motion.div>
                </motion.th>
              ))}
            </tr>
          </motion.thead>

          <motion.tbody
            className='bg-white/50 divide-y divide-gray-200'
            variants={containerVariants}
          >
            <AnimatePresence mode='popLayout'>
              {patients.map((patient, index) => (
                <PatientTableRow
                  key={patient._id}
                  patient={patient}
                  index={index}
                  deletingId={deletingId}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </AnimatePresence>
          </motion.tbody>
        </motion.table>
      </div>

      {/* Table footer with patient count */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className='bg-gray-50/80 px-6 py-4 border-t border-gray-200 flex items-center justify-between'
      >
        <div className='text-sm text-gray-700'>
          Showing{' '}
          <span className='font-semibold text-gray-900'>{patients.length}</span>{' '}
          patients
        </div>
        <div className='text-xs text-gray-500'>
          Last updated:{' '}
          {new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PatientTable;
