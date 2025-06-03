// Sample data for demonstration
const eventsData = [
    {
        id: 1,
        name: "Summer Music Festival",
        date: "2025-07-15",
        time: "18:00",
        venue: "Central Park",
        location: "New York",
        organizer: "Music Events Inc.",
        image: "event_music.png",
        price: 45.00, 
        ticketTypes: [
            { name: "General Admission", price: 45.00, available: 200 },
            { name: "VIP Pass", price: 99.00, available: 50 }
        ],
        category: "Music",
        description: "Join us for the biggest music festival of the summer featuring top artists from around the world."
    },
    {
        id: 2,
        name: "Tech Conference 2025",
        date: "2025-08-20",
        time: "09:00",
        venue: "Convention Center",
        location: "San Francisco",
        organizer: "Tech Events LLC",
        image: "event_conference.png",
        price: 299.00,
         ticketTypes: [
            { name: "Standard Delegate", price: 299.00, available: 300 },
            { name: "Student Pass", price: 149.00, available: 100 }
        ],
        category: "Technology",
        description: "Learn from industry leaders about the latest trends in technology and innovation."
    },
    {
        id: 3,
        name: "Food & Wine Expo",
        date: "2025-09-10",
        time: "11:00",
        venue: "Exhibition Hall",
        location: "Chicago",
        organizer: "Gourmet Experiences",
        image: "event_food_wine.png",
        price: 75.00,
        ticketTypes: [
            { name: "Adult Entry", price: 75.00, available: 150 },
            { name: "Tasting Ticket", price: 120.00, available: 75 }
        ],
        category: "Food & Drink",
        description: "Sample delicious foods and wines from top chefs and wineries around the country."
    },
    {
        id: 4,
        name: "Modern Art Exhibition",
        date: "2025-10-05",
        time: "10:00",
        venue: "City Art Gallery",
        location: "Paris",
        organizer: "Art Society",
        image: "event_exhibition.png",
        price: 30.00,
        ticketTypes: [
            { name: "Standard Entry", price: 30.00, available: 250 }
        ],
        category: "Art & Culture",
        description: "Explore stunning modern art pieces from renowned artists. A journey through contemporary creativity."
    }
];

let currentEventsDisplay = [...eventsData]; 
const ITEMS_PER_PAGE = 6;
let currentPage = 1;

class ShoppingCart {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('cart')) || [];
        this.serviceFee = 2.50; 
    }
    
    addItem(eventId, eventName, ticketType, quantity, price) {
        const existingItem = this.items.find(item => item.eventId === eventId && item.ticketType === ticketType);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.items.push({
                eventId,
                eventName,
                ticketType,
                quantity,
                price,
            });
        }
        this.save();
    }
    
    removeItem(index) {
        this.items.splice(index, 1);
        this.save();
    }
    
    updateQuantity(index, quantity) {
        if (quantity <= 0) {
            this.removeItem(index);
        } else {
            this.items[index].quantity = quantity;
        }
        this.save();
    }

    clearCart() {
        this.items = [];
        this.save();
    }
    
    getSubtotal() {
        return this.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    }

    getTotal() {
        const subtotal = this.getSubtotal();
        return subtotal > 0 ? subtotal + this.serviceFee : 0;
    }
    
    save() {
        localStorage.setItem('cart', JSON.stringify(this.items));
        this.updateCartUI();
        this.renderCart(); 
        this.renderCheckoutSummary(); 
    }
    
    updateCartUI() {
        const cartCount = this.items.reduce((sum, item) => sum + item.quantity, 0);
        document.querySelectorAll('.cart-count').forEach(el => {
            el.textContent = cartCount;
        });

        const subtotal = this.getSubtotal();
        const total = this.getTotal();
        
        const cartSubtotalEl = document.getElementById('cart-subtotal');
        if (cartSubtotalEl) cartSubtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        
        const cartFeeEl = document.getElementById('cart-fee');
        if(cartFeeEl) cartFeeEl.textContent = subtotal > 0 ? `$${this.serviceFee.toFixed(2)}` : '$0.00';

        const cartTotalEl = document.getElementById('cart-total');
        if (cartTotalEl) cartTotalEl.textContent = `$${total.toFixed(2)}`;

        const proceedToCheckoutBtn = document.getElementById('proceed-to-checkout-btn');
        if(proceedToCheckoutBtn) proceedToCheckoutBtn.disabled = this.items.length === 0;

        const clearCartContainer = document.getElementById('clear-cart-container');
        if(clearCartContainer) clearCartContainer.style.display = this.items.length > 0 ? 'block' : 'none';
    }
    
    renderCart() {
        const cartContainer = document.getElementById('cart-items');
        if (!cartContainer) return;
        
        if (this.items.length === 0) {
            cartContainer.innerHTML = '<p class="text-center">Your cart is empty.</p>';
            this.updateCartUI(); 
            return;
        }
        cartContainer.innerHTML = ''; 
        
        this.items.forEach((item, index) => {
            const itemTotal = item.quantity * item.price;
            const cartItemEl = document.createElement('div');
            cartItemEl.className = 'cart-item';
            cartItemEl.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h5>${item.eventName}</h5>
                        <p class="mb-1">${item.ticketType}</p>
                        <p class="mb-0"><small>$${item.price.toFixed(2)} each</small></p>
                    </div>
                    <div class="text-end">
                        <p class="mb-1 fw-bold">$${itemTotal.toFixed(2)}</p>
                        <div class="d-flex align-items-center">
                            <input type="number" value="${item.quantity}" min="1" class="form-control form-control-sm me-2" style="width: 60px;" data-index="${index}" onchange="cart.updateQuantity(${index}, parseInt(this.value))">
                            <button class="btn btn-sm btn-outline-danger remove-item" data-index="${index}"><i class="fas fa-trash-alt"></i></button>
                        </div>
                    </div>
                </div>
            `;
            cartContainer.appendChild(cartItemEl);
        });
        
        document.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                this.removeItem(index);
            });
        });
        this.updateCartUI();
    }

    renderCheckoutSummary() {
        const checkoutItemsContainer = document.getElementById('checkout-items');
        if (!checkoutItemsContainer) return;

        if (this.items.length === 0) {
            checkoutItemsContainer.innerHTML = '<p class="text-center">Your order is empty.</p>';
        } else {
            checkoutItemsContainer.innerHTML = ''; 
            this.items.forEach(item => {
                const itemEl = document.createElement('div');
                itemEl.className = 'd-flex justify-content-between mb-2';
                itemEl.innerHTML = `
                    <div>
                        <h6>${item.eventName}</h6>
                        <small>${item.ticketType} x ${item.quantity}</small>
                    </div>
                    <span>$${(item.quantity * item.price).toFixed(2)}</span>
                `;
                checkoutItemsContainer.appendChild(itemEl);
            });
        }

        const subtotal = this.getSubtotal();
        const total = this.getTotal();

        const checkoutSubtotalEl = document.getElementById('checkout-subtotal');
        if(checkoutSubtotalEl) checkoutSubtotalEl.textContent = `$${subtotal.toFixed(2)}`;

        const checkoutFeeEl = document.getElementById('checkout-fee');
         if(checkoutFeeEl) checkoutFeeEl.textContent = subtotal > 0 ? `$${this.serviceFee.toFixed(2)}` : '$0.00';
        
        const checkoutTotalEl = document.getElementById('checkout-total');
        if(checkoutTotalEl) checkoutTotalEl.textContent = `$${total.toFixed(2)}`;
    }
}

const cart = new ShoppingCart();

function displayEvents(eventsToDisplay, containerElement, page = 1) {
    if (!containerElement) return;
    containerElement.innerHTML = ''; 

    const paginatedEvents = eventsToDisplay.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    if (paginatedEvents.length === 0 && page === 1) {
         containerElement.innerHTML = '<p class="text-center col-12">No events found matching your criteria.</p>';
         return;
    }


    paginatedEvents.forEach(event => {
        const eventCard = document.createElement('div');
        eventCard.className = containerElement.id === 'featured-events' ? 'col-md-6 mb-4' : 'col-md-4 mb-4';
        
        eventCard.innerHTML = `
            <div class="card h-100">
                <img src="${event.image}" class="card-img-top" alt="${event.name}">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${event.name}</h5>
                    <p class="card-text small">
                        <i class="fas fa-calendar-alt"></i> ${new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}<br>
                        <i class="fas fa-clock"></i> ${event.time}<br>
                        <i class="fas fa-map-marker-alt"></i> ${event.location} - ${event.venue}<br>
                        <strong class="d-block mt-1">Starts from $${event.price.toFixed(2)}</strong>
                    </p>
                    <a href="#" class="btn btn-primary mt-auto" onclick="document.getElementById('event-details-tab').click(); loadEventDetails(${event.id}); return false;">View Details</a>
                </div>
            </div>
        `;
        containerElement.appendChild(eventCard);
    });
}

function setupPagination(totalItems, containerElement) {
    if (!containerElement) return;
    containerElement.innerHTML = '';
    const pageCount = Math.ceil(totalItems / ITEMS_PER_PAGE);

    if (pageCount <= 1) return; 

    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" data-page="${currentPage - 1}">Previous</a>`;
    containerElement.appendChild(prevLi);

    for (let i = 1; i <= pageCount; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
        containerElement.appendChild(li);
    }

    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === pageCount ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" data-page="${currentPage + 1}">Next</a>`;
    containerElement.appendChild(nextLi);

    containerElement.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = parseInt(this.dataset.page);
            if (page > 0 && page <= pageCount && page !== currentPage) {
                currentPage = page;
                displayEvents(currentEventsDisplay, document.getElementById('events-container'), currentPage);
                setupPagination(currentEventsDisplay.length, document.getElementById('pagination'));
                 window.scrollTo(0,0); 
            }
        });
    });
}


document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('current-year').textContent = new Date().getFullYear();

    const featuredEventsContainer = document.getElementById('featured-events');
    displayEvents(eventsData.slice(0, 2), featuredEventsContainer);
    
    const eventsContainer = document.getElementById('events-container');
    displayEvents(currentEventsDisplay, eventsContainer, currentPage);
    setupPagination(currentEventsDisplay.length, document.getElementById('pagination'));

    const upcomingEventsSidebarContainer = document.getElementById('upcoming-events-sidebar');
    if (upcomingEventsSidebarContainer) {
        const sortedUpcoming = [...eventsData]
            .filter(event => new Date(event.date) >= new Date())
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 3);
        
        if (sortedUpcoming.length > 0) {
            sortedUpcoming.forEach(event => {
                const eventDiv = document.createElement('div');
                eventDiv.className = 'mb-2 small';
                eventDiv.innerHTML = `
                    <a href="#" onclick="document.getElementById('event-details-tab').click(); loadEventDetails(${event.id}); return false;">${event.name}</a>
                    <div>${new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${event.location}</div>
                `;
                upcomingEventsSidebarContainer.appendChild(eventDiv);
            });
        } else {
            upcomingEventsSidebarContainer.innerHTML = '<p class="small">No upcoming events.</p>';
        }
    }
    
    cart.save(); 
    
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', function() {
            const eventId = parseInt(this.dataset.eventId);
            const currentEvent = eventsData.find(e => e.id === eventId);
            if (!currentEvent) return;

            const ticketInputs = document.querySelectorAll('#ticket-types .ticket-quantity-input');
            let itemsAdded = 0;
            ticketInputs.forEach(input => {
                const quantity = parseInt(input.value);
                if (quantity > 0) {
                    const ticketType = input.dataset.ticketType;
                    const price = parseFloat(input.dataset.price);
                    cart.addItem(eventId, currentEvent.name, ticketType, quantity, price);
                    itemsAdded++;
                    input.value = 0; 
                }
            });
            if (itemsAdded > 0) {
                 alert(`Ticket(s) added to cart!`);
            } else {
                alert(`Please select quantity for at least one ticket type.`);
            }
        });
    }
    
    const clearCartBtn = document.getElementById('clear-cart-btn');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to clear your cart?')) {
                cart.clearCart();
            }
        });
    }
    
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (cart.items.length === 0) {
                alert('Your cart is empty. Please add items to your cart before checkout.');
                document.getElementById('events-tab').click(); 
                return;
            }
            const firstName = document.getElementById('checkout-first-name').value;
            if (!firstName) {
                alert('Please enter your first name.');
                return;
            }

            alert('Thank you for your booking! Your tickets have been reserved.');
            cart.clearCart();
            checkoutForm.reset(); 
            document.getElementById('home-tab').click(); 
        });
    }

    const paymentMethodRadios = document.querySelectorAll('input[name="payment-method"]');
    const creditCardFields = document.getElementById('credit-card-fields');
    const paypalFields = document.getElementById('paypal-fields');

    paymentMethodRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'credit-card') {
                creditCardFields.style.display = 'block';
                paypalFields.style.display = 'none';
            } else if (this.value === 'paypal') {
                creditCardFields.style.display = 'none';
                paypalFields.style.display = 'block';
            }
        });
    });


    const searchForm = document.getElementById('search-form');
    if(searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            filterAndDisplayEvents();
        });
    }

    document.querySelectorAll('.sort-option').forEach(option => {
        option.addEventListener('click', function(e) {
            e.preventDefault();
            const sortBy = this.dataset.sort;
            sortEvents(sortBy);
            document.getElementById('sortDropdown').textContent = `Sort By: ${this.textContent}`;
        });
    });

    updateAdminStats();
    loadAdminRecentEvents();

    const adminNavLinks = document.querySelectorAll('.admin-sidebar .nav-link');
    const adminSections = document.querySelectorAll('.admin-content .admin-section');

    adminNavLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.dataset.target;
            
            adminNavLinks.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            adminSections.forEach(section => {
                section.style.display = section.id === targetId ? 'block' : 'none';
            });
        });
    });
    
    const dashboardNavLinks = document.querySelectorAll('#dashboard-menu .list-group-item-action');
    const dashboardSections = document.querySelectorAll('#dashboard-content .dashboard-section');

    dashboardNavLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            if (this.textContent === 'Logout') { /* Handle logout */ return; }

            const targetId = this.dataset.target;
            
            dashboardNavLinks.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            dashboardSections.forEach(section => {
                section.style.display = section.id === targetId ? 'block' : 'none';
            });
        });
    });


});

function switchAdminSection(targetId) {
    document.querySelector(`.admin-sidebar .nav-link[data-target="${targetId}"]`).click();
}


function filterAndDisplayEvents() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const locationFilter = document.getElementById('location-filter').value;
    const dateFilter = document.getElementById('date-filter').value;

    currentEventsDisplay = eventsData.filter(event => {
        const matchesSearchTerm = event.name.toLowerCase().includes(searchTerm) || event.description.toLowerCase().includes(searchTerm);
        const matchesLocation = locationFilter ? event.location === locationFilter : true;
        const matchesDate = dateFilter ? event.date === dateFilter : true;
        return matchesSearchTerm && matchesLocation && matchesDate;
    });
    
    currentPage = 1; 
    displayEvents(currentEventsDisplay, document.getElementById('events-container'), currentPage);
    setupPagination(currentEventsDisplay.length, document.getElementById('pagination'));
    
    const eventsTabButton = document.getElementById('events-tab');
    if(eventsTabButton && !eventsTabButton.classList.contains('active')) {
         new bootstrap.Tab(eventsTabButton).show();
    }
}

function sortEvents(criteria) {
    switch(criteria) {
        case 'date-asc':
            currentEventsDisplay.sort((a,b) => new Date(a.date) - new Date(b.date));
            break;
        case 'date-desc':
            currentEventsDisplay.sort((a,b) => new Date(b.date) - new Date(a.date));
            break;
        case 'price-asc':
            currentEventsDisplay.sort((a,b) => a.price - b.price);
            break;
        case 'price-desc':
            currentEventsDisplay.sort((a,b) => b.price - a.price);
            break;
    }
    currentPage = 1; 
    displayEvents(currentEventsDisplay, document.getElementById('events-container'), currentPage);
    setupPagination(currentEventsDisplay.length, document.getElementById('pagination'));
}


function loadEventDetails(eventId) {
    const event = eventsData.find(e => e.id === eventId);
    if (!event) return;
    
    document.getElementById('event-detail-main-image').src = event.image;
    document.getElementById('event-detail-main-image').alt = event.name;
    document.getElementById('event-detail-title').textContent = event.name;
    document.getElementById('event-detail-category').textContent = event.category;
    document.getElementById('event-detail-short-date').textContent = new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    document.getElementById('event-detail-description').textContent = event.description;
    document.getElementById('event-detail-full-date').textContent = new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    document.getElementById('event-detail-time').textContent = event.time;
    document.getElementById('event-detail-venue').textContent = event.venue;
    document.getElementById('event-detail-organizer').textContent = event.organizer;

    const ticketTypesContainer = document.getElementById('ticket-types');
    ticketTypesContainer.innerHTML = ''; 
    if (event.ticketTypes && event.ticketTypes.length > 0) {
        event.ticketTypes.forEach(tt => {
            const ttDiv = document.createElement('div');
            ttDiv.className = 'mb-3';
            ttDiv.innerHTML = `
                <label class="form-label">${tt.name} - $${tt.price.toFixed(2)} (Available: ${tt.available})</label>
                <input type="number" class="form-control ticket-quantity-input" min="0" max="${tt.available}" value="0" data-ticket-type="${tt.name}" data-price="${tt.price}">
            `;
            ticketTypesContainer.appendChild(ttDiv);
        });
    } else { 
         const ttDiv = document.createElement('div');
            ttDiv.className = 'mb-3';
            ttDiv.innerHTML = `
                <label class="form-label">Standard Ticket - $${event.price.toFixed(2)}</label>
                <input type="number" class="form-control ticket-quantity-input" min="0" max="100" value="0" data-ticket-type="Standard Ticket" data-price="${event.price}">
            `; 
            ticketTypesContainer.appendChild(ttDiv);
    }
    
    document.getElementById('add-to-cart-btn').dataset.eventId = eventId;
    window.scrollTo(0,0); 
}

function updateAdminStats() {
    document.getElementById('total-events').textContent = eventsData.length;
}

function loadAdminRecentEvents() {
    const container = document.getElementById('recent-events-admin');
    if (!container) return;
    container.innerHTML = '';
    const recent = eventsData.slice().sort((a,b) => b.id - a.id).slice(0,3); 
    if (recent.length > 0) {
        recent.forEach(event => {
            const eventDiv = document.createElement('div');
            eventDiv.className = 'd-flex justify-content-between align-items-center mb-3';
            eventDiv.innerHTML = `
                <div>
                    <h6>${event.name}</h6>
                    <small class="text-muted">${new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</small>
                </div>
                <div>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="loadEventDetailsForAdminEdit(${event.id})">Edit</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteEventFromAdmin(${event.id})">Delete</button>
                </div>
            `;
            container.appendChild(eventDiv);
        });
    } else {
        container.innerHTML = '<p class="text-center">No recent events found.</p>';
    }
}

function loadEventDetailsForAdminEdit(eventId) {
    alert(`Admin: Edit event ID ${eventId}`);
    switchAdminSection('admin-events-content');
}

function deleteEventFromAdmin(eventId) {
    if(confirm(`Admin: Are you sure you want to delete event ID ${eventId}? This action cannot be undone.`)){
        const index = eventsData.findIndex(e => e.id === eventId);
        if (index > -1) {
            eventsData.splice(index, 1);
            currentEventsDisplay = currentEventsDisplay.filter(e => e.id !== eventId); 
            
            displayEvents(currentEventsDisplay, document.getElementById('events-container'), currentPage);
            setupPagination(currentEventsDisplay.length, document.getElementById('pagination'));
            displayEvents(eventsData.slice(0, 2), document.getElementById('featured-events')); 
            updateAdminStats();
            loadAdminRecentEvents();
            alert(`Event ID ${eventId} deleted.`);
        }
    }
}