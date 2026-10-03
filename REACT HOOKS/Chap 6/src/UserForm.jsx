import { useState, useActionState } from 'react'
import { Form, Button, Alert } from 'react-bootstrap'

function UserForm() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const handleSubmit = (state, formData) => {
        const email = formData.get("email")
        const password = formData.get("password")

        // validate email
        let emailValid = false;
        let passwordValid = false;
        if (!email || email.length == 0) {
            state.emailError = "Email is required"
        }
        else if (email.length < 6) {
            state.emailError = "Email should be minimum 6 characters"
        }
        else if (email.indexOf(' ') >= 0) {
            state.emailError = "Email cannot contain spaces"
        }
        else {
            state.emailError = ""
            emailValid = true
        }
        // Password validation
        if (!password || password.length == 0) {
            state.passwordError = "Password is required";

        } else if (password.length < 8) {
            state.passwordError = "Password should be minimum 8 characters";

        } else if (password.indexOf(' ') >= 0) {
            state.passwordError = "Password cannot contain spaces";

        } else {
            state.passwordError = ""
            passwordValid = true;
        }

        if (emailValid && passwordValid) {
            alert(`Email: ${email}\nPassword: ${password}`)
            setEmail("")
            setPassword("")
        }

        return state
    }

    const [state, formAction] = useActionState(handleSubmit, {
        emailError: "",
        passwordError: ""
    })

    return (
        <div>
            <Form action={formAction}>
                <Form.Group className="mb-3" controlId="formBasicEmail">
                    <Form.Label>Email address</Form.Label>
                    <Form.Control
                        type="email"
                        name="email"
                        placeholder="Enter email"
                        value={email}
                        onChange={e => setEmail(e.target.value)} />
                    <Form.Text className="text-muted">
                        We'll never share your email with anyone else.
                    </Form.Text>
                </Form.Group>
                {state && state.emailError.length > 0 &&
                    <Alert variant="danger">{state.emailError}</Alert>}
                <Form.Group className="mb-3" controlId="formBasicPassword">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                        type="password"
                        name="password"
                        placeholder="Enter Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)} />
                </Form.Group>
                {state && state.passwordError.length > 0 && <Alert variant="danger">{state.passwordError}</Alert>}
                <Button variant="primary" type="submit">
                    Submit
                </Button>
            </Form>
            Email entered: {email}
            <br />
            Password entered: {password}
        </div>
    )
}

export default UserForm
