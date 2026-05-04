import './spinner.css'

interface SpinnerProps {
  size?: number
}

export function Spinner({ size = 24 }: SpinnerProps) {
  return <div className="ui-spinner" style={{ width: size, height: size }} />
}

export function CenteredSpinner() {
  return (
    <div className="ui-spinner-center">
      <Spinner />
    </div>
  )
}
