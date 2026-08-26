namespace Con {
    export enum Control { Unknown, Keyboard, Controller1, Controller2 }
    // Initialize to Unknown (0) instead of -1
    export let control: Control = Control.Unknown

    export function update() {
        detectInput()

        switch (control) {
            case Control.Keyboard:
                Walk.U = browserEvents.W.isPressed()
                Walk.D = browserEvents.S.isPressed()
                Walk.L = browserEvents.A.isPressed()
                Walk.R = browserEvents.D.isPressed()

                Turn.U = browserEvents.ArrowUp.isPressed()
                Turn.D = browserEvents.ArrowDown.isPressed()
                Turn.L = browserEvents.ArrowLeft.isPressed()
                Turn.R = browserEvents.ArrowRight.isPressed()

                Other.A = browserEvents.Z.isPressed() || browserEvents.Q.isPressed() || browserEvents.Space.isPressed()
                Other.B = browserEvents.X.isPressed() || browserEvents.E.isPressed() || browserEvents.Enter.isPressed()
                break

            case Control.Controller1:
                Walk.U = controller.up.isPressed()
                Walk.D = controller.down.isPressed()
                Walk.L = false
                Walk.R = false

                Turn.U = false
                Turn.D = false
                Turn.L = controller.left.isPressed()
                Turn.R = controller.right.isPressed()

                Other.A = controller.A.isPressed()
                Other.B = controller.B.isPressed()
                break

            case Control.Controller2:
                Walk.U = controller.player1.up.isPressed()
                Walk.D = controller.player1.down.isPressed()
                Walk.L = controller.player1.left.isPressed()
                Walk.R = controller.player1.right.isPressed()

                Turn.U = controller.player2.up.isPressed()
                Turn.D = controller.player2.down.isPressed()
                Turn.L = controller.player2.left.isPressed()
                Turn.R = controller.player2.right.isPressed()

                Other.A = controller.player1.A.isPressed() || controller.player2.A.isPressed()
                Other.B = controller.player1.B.isPressed() || controller.player2.B.isPressed()
                break
        }

        any = Walk.U || Walk.D || Walk.L || Walk.R ||
            Turn.U || Turn.D || Turn.L || Turn.R ||
            Other.A || Other.B
    }

    export function detectInput() {
        if (control === Control.Unknown) {
            if (controller.player2.connected) control = Control.Controller2
            else if (browserEvents.Any.isPressed()) control = Control.Keyboard
            else if (controller.anyButton.isPressed()) control = Control.Controller1
        }
    }

    export namespace Walk { export let U = false, D = false, L = false, R = false }
    export namespace Turn { export let U = false, D = false, L = false, R = false }
    export namespace Other { export let A = false, B = false }
    export let any = false
}