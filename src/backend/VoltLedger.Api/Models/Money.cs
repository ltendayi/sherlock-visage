namespace VoltLedger.Api.Models
{
    /// <summary>
    /// Money class using INTEGER cents (not decimal) per fintech specifications.
    /// This avoids floating-point precision errors in financial calculations.
    /// </summary>
    public readonly struct Money : IEquatable<Money>, IComparable<Money>
    {
        public long Cents { get; }
        
        public Money(long cents)
        {
            Cents = cents;
        }
        
        public static Money FromKes(decimal kesAmount)
        {
            return new Money((long)(kesAmount * 100));
        }
        
        public decimal ToKes()
        {
            return Cents / 100m;
        }
        
        public static Money Zero => new Money(0);
        
        public static Money operator +(Money a, Money b)
        {
            return new Money(a.Cents + b.Cents);
        }
        
        public static Money operator -(Money a, Money b)
        {
            return new Money(a.Cents - b.Cents);
        }
        
        public static Money operator *(Money a, int multiplier)
        {
            return new Money(a.Cents * multiplier);
        }
        
        public static Money operator /(Money a, int divisor)
        {
            if (divisor == 0) throw new DivideByZeroException();
            return new Money(a.Cents / divisor);
        }
        
        public static bool operator >(Money a, Money b)
        {
            return a.Cents > b.Cents;
        }
        
        public static bool operator <(Money a, Money b)
        {
            return a.Cents < b.Cents;
        }
        
        public static bool operator >=(Money a, Money b)
        {
            return a.Cents >= b.Cents;
        }
        
        public static bool operator <=(Money a, Money b)
        {
            return a.Cents <= b.Cents;
        }
        
        public bool Equals(Money other)
        {
            return Cents == other.Cents;
        }
        
        public override bool Equals(object? obj)
        {
            return obj is Money other && Equals(other);
        }
        
        public override int GetHashCode()
        {
            return Cents.GetHashCode();
        }
        
        public int CompareTo(Money other)
        {
            return Cents.CompareTo(other.Cents);
        }
        
        public override string ToString()
        {
            return $"KES {ToKes():N2}";
        }
        
        public string ToKesString()
        {
            return ToKes().ToString("F2");
        }
    }
}
