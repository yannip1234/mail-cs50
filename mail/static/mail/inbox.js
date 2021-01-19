document.addEventListener('DOMContentLoaded', function () {

    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', () => compose_email(false));

    document.querySelector('form').onsubmit = function () {
        const dest = document.querySelector('#compose-recipients').value;
        const subject = document.querySelector('#compose-subject').value;
        const body = document.querySelector('#compose-body').value;
        fetch('/emails', {
            method: 'POST',
            body: JSON.stringify({
                recipients: dest,
                subject: subject,
                body: body
            })
        })
            .then(response => response.json())
            .then(result => {
                console.log(result);
            })
        load_mailbox('sent');
    }

    // By default, load the inbox
    load_mailbox('inbox');
});

function escapeOutput(toOutput) {
    return toOutput.replace(/\&/g, '&amp;')
        .replace(/\</g, '&lt;')
        .replace(/\>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/\'/g, '&#x27')
        .replace(/\//g, '&#x2F');
}

function compose_email(reply) {

    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
    if (!reply) {
        document.querySelector('#email-view').style.display = 'none';
    }
    // Clear out composition fields and reset
    document.querySelector('#compose-recipients').disabled = false;
    document.querySelector('#compose-subject').disabled = false;
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
}

function load_message(id, mailbox) {
    document.querySelector('#email-view').style.display = 'block';
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';

    //Clear
    document.querySelector('#from-header').innerHTML = "";
    document.querySelector('#to-header').innerHTML = "";
    document.querySelector('#subject-header').innerHTML = "";
    document.querySelector('#time-header').innerHTML = "";
    document.querySelector('#body').innerHTML = "";


    fetch(`/emails/${id}`)
        .then(response => response.json())
        .then(res => {
            const from = res.sender;
            const to = res.recipients;
            const subject = res.subject;
            const timestamp = res.timestamp;
            const body = escapeOutput(res.body);

            //Reply
            document.querySelector('#reply').addEventListener('click', () => {
                compose_email(true);
                document.querySelector('#compose-view').querySelector("h3").innerHTML = "Reply";
                document.querySelector('#compose-recipients').value = res.sender;
                document.querySelector('#compose-recipients').disabled = true;
                if (res.subject.includes("RE:")) {
                    document.querySelector('#compose-subject').value = res.subject;
                } else {
                    document.querySelector('#compose-subject').value = `RE: ${res.subject}`;
                }
                document.querySelector('#compose-subject').disabled = true;
                document.querySelector('#compose-body').value = `On ${res.timestamp} ${res.sender} wrote: \n\t${res.body}
                `
            })
            //Check Archive

            if (mailbox !== 'sent') {
                if (res.archived === true) {
                    document.querySelector("#archive").innerHTML = "Unarchive";
                    //Unarchive
                    document.querySelector('#archive').addEventListener('click', () => {
                        fetch(`/emails/${id}`, {
                            method: 'PUT',
                            body: JSON.stringify({
                                archived: false
                            })
                        })
                            .then(data => {

                                load_mailbox('inbox');

                            });
                    })
                } else {
                    //Archive
                    document.querySelector("#archive").innerHTML = "Archive";
                    document.querySelector('#archive').addEventListener('click', () => {

                        fetch(`/emails/${id}`, {
                            method: 'PUT',
                            body: JSON.stringify({
                                archived: true
                            })
                        })
                            .then(data => {
                                load_mailbox('inbox');

                            });
                    })
                }
            } else {
                try {
                    document.querySelector('#archive').style.display = 'none';
                } catch (ex){}

            }


            document.querySelector('#from-header').innerHTML = `<strong>From:</strong> ${from}`;
            document.querySelector('#to-header').innerHTML = `<strong>To:</strong> ${to}`;
            document.querySelector('#subject-header').innerHTML = `<strong>Subject:</strong> ${subject}`;
            document.querySelector('#time-header').innerHTML = `<strong>Timestamp:</strong> ${timestamp}`;
            document.querySelector('#body').innerHTML = body;
        })
    fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
    })
}

function generate_email(email, mailbox) {
    const element = document.createElement('tr');
    const head = document.createElement('th');
    const subject = document.createElement('td')
    const timestamp = document.createElement('td')
    if (email.read === true) {
        element.classList.add("table-secondary");
    }
    head.scope = 'row';

    if (mailbox === 'sent') {
        head.innerHTML = email.recipients;
    } else {
        head.innerHTML = email.sender;
    }

    subject.innerHTML = email.subject;

    timestamp.innerHTML = email.timestamp;

    element.append(head, subject, timestamp);

    element.addEventListener('click', () => load_message(email.id, mailbox));
    document.querySelector('#table-body').append(element);
}

function load_mailbox(mailbox) {

    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'none';

    //Clear
    document.querySelector('#mailbox').innerHTML = "";
    document.querySelector('#table-body').innerHTML = "";

    // Show the mailbox name
    let title = document.createElement('h3');
    title.innerText = `${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}`;
    document.querySelector('#mailbox').prepend(title);

    //Set table heading
    if (mailbox === 'sent')
        document.querySelector('thead').innerHTML = `<th scope="col">To:</th><th scope="col">Subject:</th><th scope="col">Sent:</th>`
    else {
        document.querySelector('thead').innerHTML = `<th scope="col">From:</th><th scope="col">Subject:</th><th scope="col">Received:</th>`
    }

    fetch(`/emails/${mailbox}`)
        .then(response => response.json())
        .then(result => {
            console.log(result)
            result.forEach(email => {
                generate_email(email, mailbox);
            })


        })

}