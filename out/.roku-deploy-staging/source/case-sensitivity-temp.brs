sub error1()
    a = 1
    print A ' error
    print "a="; A ' error
    some(A) ' error
    some(1 + A) ' error
end sub

sub error2()
    a = 1
    A = 2 ' error
end sub

sub error3(A)
    a = 2 ' error
end sub

sub ok1()
    A = 1
    print A
    print "A="; A
    some(A)
    some(1 + A)
end sub

sub some(p)
    print p
end sub
