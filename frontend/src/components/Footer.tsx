import React from 'react'

export default function Footer() {
    const date = new Date();
    const year = date.getFullYear(); //get current year

    return (
        <footer>
            <div> 
                <p>&copy; {year} SimpleVAL. All rights reserved.</p>
            </div>
        </footer>
    )
}
