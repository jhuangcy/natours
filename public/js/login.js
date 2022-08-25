import axios from 'axios'
import { showAlert } from './alerts'

// Will call our own server api to login
export const login = async (email, password) =>
{
    // console.log(email, password)
    try 
    {
        // Don't need to specify full url because client/server are on the same base url
        const res = await axios({
            method: 'post',
            url: '/api/v1/users/login',
            data: {email, password}
        })
        // console.log(res)

        // Redirect on successful login
        if (res.data.status === 'success') 
        {
            // alert('Logged in successfully')
            showAlert('success', 'Logged in successfully')
            window.setTimeout(() =>
            {
                location.assign('/')
            }, 2000)
        }
    } 
    catch (error) 
    {
        // alert(error.response.data.message)
        showAlert('error', error.response.data.message)
    }
}

// Moved to index.js
// document.querySelector('.form').addEventListener('submit', e =>
// {
//     e.preventDefault()

//     const email = document.getElementById('email').value
//     const password = document.getElementById('password').value

//     login(email, password)
// })

// Call our own server api to logout
export const logout = async () =>
{
    try 
    {
        const res = await axios({
            method: 'get',
            url: '/api/v1/users/logout'
        })
        
        if (res.data.status === 'success') 
        {
            // console.log(location)
            if (location.pathname.startsWith('/tour')) 
            {
                location.reload(true)   // Hard refresh page
            }
            else 
            {
                location.assign('/')    // Redirect to home
            }
        }
    } 
    catch (error) 
    {
        showAlert('error', 'Error logging out')
    }
}