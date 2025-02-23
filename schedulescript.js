document.addEventListener('DOMContentLoaded', function() {
    // Initialize all modals and their functionality
    initializeModals();

    // Medication Refresh Button Animation
    const refreshBtn = document.querySelector('.refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            const icon = this.querySelector('i');
            icon.style.animation = 'rotate 1s linear';
            setTimeout(() => {
                icon.style.animation = '';
            }, 1000);
        });
    }

    function initializeModals() {
        // Task Modal
        initializeModal({
            modalId: 'addTaskModal',
            buttonClass: 'add-task-btn',
            formId: 'addTaskForm',
            createElementFn: createTaskElement,
            listClass: '.tasks-list',
            insertMethod: 'append'
        });

        // Medication Modal
        initializeModal({
            modalId: 'addMedicationModal',
            buttonClass: 'add-medication-btn',
            formId: 'addMedicationForm',
            createElementFn: createMedicationElement,
            listClass: '.medication-card',
            insertMethod: 'beforeButton'
        });

        // Appointment Modal
        initializeModal({
            modalId: 'addAppointmentModal',
            buttonClass: 'add-appointment-btn',
            formId: 'addAppointmentForm',
            createElementFn: createAppointmentElement,
            listClass: '.appointments-card',
            insertMethod: 'beforeButton'
        });
    }

    function initializeModal({ modalId, buttonClass, formId, createElementFn, listClass, insertMethod }) {
        const modal = document.getElementById(modalId);
        const openBtn = document.querySelector(`.${buttonClass}`);
        const closeBtn = modal.querySelector('.close-modal-btn');
        const cancelBtn = modal.querySelector('.cancel-btn');
        const form = document.getElementById(formId);
        const listContainer = document.querySelector(listClass);

        // Open modal
        openBtn.addEventListener('click', () => {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        });

        // Close modal functions
        function closeModal() {
            modal.classList.remove('show');
            document.body.style.overflow = '';
            form.reset();
        }

        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Handle form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get all form data
            const formData = {};
            form.querySelectorAll('input, select, textarea').forEach(input => {
                if (input.id) {
                    formData[input.id] = input.value;
                }
            });

            // Create new element
            const newElement = createElementFn(formData);
            
            // Add to list
            if (insertMethod === 'beforeButton') {
                const addButton = listContainer.querySelector(`.${buttonClass}`);
                listContainer.insertBefore(newElement, addButton);
            } else {
                listContainer.appendChild(newElement);
            }

            // Close modal and reset form
            closeModal();
        });
    }

    function createTaskElement(data) {
        const taskItem = document.createElement('div');
        taskItem.className = 'task-item';
        
        const formattedDate = formatDate(data.taskDate);
        const formattedTime = formatTime(data.taskTime);

        taskItem.innerHTML = `
            <div class="task-info">
                <div class="task-header">
                    <span class="task-name">${data.taskName}</span>
                    <span class="task-priority priority-${data.taskPriority}">${data.taskPriority}</span>
                </div>
                <div class="task-details">
                    ${formattedDate} at ${formattedTime}
                </div>
                ${data.taskNotes ? `<div class="task-notes">${data.taskNotes}</div>` : ''}
            </div>
            <button class="delete-btn"><i class="fas fa-trash"></i></button>
        `;

        // Add delete functionality
        const deleteBtn = taskItem.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => taskItem.remove());

        return taskItem;
    }

    function createMedicationElement(data) {
        const medicationItem = document.createElement('div');
        medicationItem.className = 'medication-item';
        medicationItem.innerHTML = `
            <div class="med-info">
                <span class="med-name">${data.medicationName}</span>
                <span class="med-dose">${data.medicationDose} - ${data.frequency}</span>
                <span class="med-time">${formatDate(data.startDate)} at ${data.medicationTime}</span>
                ${data.medicationNotes ? `<span class="med-notes">${data.medicationNotes}</span>` : ''}
            </div>
            <button class="refresh-btn">
                <i class="fas fa-sync-alt"></i>
            </button>
        `;
        return medicationItem;
    }

    function createAppointmentElement(data) {
        const appointmentItem = document.createElement('div');
        appointmentItem.className = 'appointment-item';
        
        const formattedDate = formatDate(data.appointmentDate);
        const formattedTime = formatTime(data.appointmentTime);

        appointmentItem.innerHTML = `
            <div class="appointment-info">
                <h3>Dr. ${data.doctorName}</h3>
                <p>${data.specialization} - ${data.appointmentType}</p>
                ${data.appointmentNotes ? `<p class="appointment-notes">${data.appointmentNotes}</p>` : ''}
            </div>
            <div class="appointment-time">
                <span>${formattedDate}</span>
                <span>${formattedTime}</span>
            </div>
        `;
        return appointmentItem;
    }

    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    function formatTime(timeString) {
        return new Date(`2000/01/01 ${timeString}`).toLocaleTimeString([], { 
            hour: 'numeric', 
            minute: '2-digit'
        });
    }

    function setActive(element) {
        // Remove active class from all items
        document.querySelectorAll('.sidebar li').forEach(item => {
            item.classList.remove('active');
        });
        // Add active class to clicked item
        element.classList.add('active');
    }

    // For mobile responsiveness
    const menuBtn = document.querySelector('.profile-btn');
    const sidebar = document.querySelector('.sidebar');

    if (menuBtn && sidebar) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('show');
        });

        // Close sidebar when clicking outside
        document.addEventListener('click', (e) => {
            if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
                sidebar.classList.remove('show');
            }
        });
    }
}); 