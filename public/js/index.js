import 'regenerator-runtime/runtime'
import { login, logout } from './login'
import { displayMap } from './mapbox'
import { updateSettings } from './updateSettings'
import { bookTour } from './stripe'
import { showAlert } from './alerts'

// See if map element exists first (to remove console errors on other pages)
const mapbox = document.getElementById('map')
if (mapbox)
{
    const locations = JSON.parse(mapbox.dataset.locations)
    displayMap(locations)
}

const loginForm = document.querySelector('.form--login')
if (loginForm)
{
    loginForm.addEventListener('submit', e =>
    {
        e.preventDefault()

        const email = document.getElementById('email').value
        const password = document.getElementById('password').value
        login(email, password)
    })
}

const logoutBtn = document.querySelector('.nav__el--logout')
if (logoutBtn) 
{
    logoutBtn.addEventListener('click', logout)
}

const userDataForm = document.querySelector('.form-user-data')
if (userDataForm)
{
    userDataForm.addEventListener('submit', e =>
    {
        e.preventDefault()

        // const name = document.getElementById('name').value
        // const email = document.getElementById('email').value

        // Sending as form data instead (multipart/form-data)
        const form = new FormData()
        form.append('name', document.getElementById('name').value)
        form.append('email', document.getElementById('email').value)
        form.append('photo', document.getElementById('photo').files[0])

        // updateData(name, email)
        // updateSettings({name, email}, 'data')
        updateSettings(form, 'data')
    })
}

const userPasswordForm = document.querySelector('.form-user-password')
if (userPasswordForm)
{
    userPasswordForm.addEventListener('submit', async e =>
    {
        e.preventDefault()
        document.querySelector('.btn--save-password').textContent = 'Updating...'

        const passwordCurrent = document.getElementById('password-current').value
        const password = document.getElementById('password').value
        const passwordConfirm = document.getElementById('password-confirm').value
        await updateSettings({passwordCurrent, password, passwordConfirm}, 'password')

        document.querySelector('.btn--save-password').textContent = 'Save password'
        document.getElementById('password-current').value = ''
        document.getElementById('password').value = ''
        document.getElementById('password-confirm').value = ''
    })
}

const bookBtn = document.getElementById('book-tour')
if (bookBtn)
{
    bookBtn.addEventListener('click', e =>
    {
        e.target.textContent = 'Processing...'

        // Tour id is stored in the button's data attribute (tour-id becomes tourId)
        const {tourId} = e.target.dataset
        bookTour(tourId)
    })
}

// For showing alert when checkout booking completes
const alertMessage = document.querySelector('body').dataset.alert
if (alert) showAlert('success', alertMessage)