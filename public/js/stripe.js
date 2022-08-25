import axios from 'axios'
import { showAlert } from './alerts'

export const bookTour = async tourId =>
{
    // Stripe publishable key
    const stripe = Stripe('pk_test_51KnlGKJKEk2EsCP98IJqG3jxymjj3Wwukr9S6jXfxADyy42GVOnx4i757lDtFvL8tv6wHYECNG2mIQfk2w5gWpCL00WPMR6a8Q');
    
    try 
    {
        // Get session from server by calling our own api
        const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`)
        // console.log(session)
    
        // Create checkout form & charge credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        })
    } 
    catch (error) 
    {
        console.log(error)
        showAlert('error', error)
    }
}