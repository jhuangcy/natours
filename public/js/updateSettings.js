import axios from 'axios'
import { showAlert } from './alerts'

// Call our own api to update personal profile (incl password option too)
// export const updateData = async (name, email) =>
export const updateSettings = async (data, type) =>
{
    const url = type ==='password' ? '/api/v1/users/updatemypassword' : '/api/v1/users/updateme'

    try 
    {
        const res = await axios({
            method: 'patch',
            // url: 'http://localhost:3000/api/v1/users/updateme',
            url,
            // data: {name, email}
            data
        })

        if (res.data.status === 'success') 
        {
            showAlert('success', `${type.toUpperCase()} updated successfully`)
            window.setTimeout(() => location.reload(), 1000)
        }
    } 
    catch (error) 
    {
        showAlert('error', error.response.data.message)
    }
}